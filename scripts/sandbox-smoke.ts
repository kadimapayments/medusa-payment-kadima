/**
 * Live sandbox smoke test — exercises the REAL clients against Kadima sandbox.
 * Run: KADIMA_TOKEN=... npx tsx scripts/sandbox-smoke.ts
 *
 * Demo Merchant: terminal 404, dba 466. Test cards are sandbox PANs (not real).
 */
import { KadimaCardClient } from "../src/lib/kadima-card-client"
import { KadimaAchClient } from "../src/lib/kadima-ach-client"
import { KadimaVaultClient } from "../src/lib/kadima-vault-client"

const apiToken = process.env.KADIMA_TOKEN!
const webhookSecret = process.env.KADIMA_WEBHOOK ?? ""
const common = { apiToken, webhookSecret, sandbox: true as const }

const card = new KadimaCardClient({ ...common, terminalId: 404, dbaId: 466 })
const ach = new KadimaAchClient({ ...common, dbaId: 466, secCode: "WEB" })
const vault = new KadimaVaultClient({ ...common, terminalId: 404, dbaId: 466 })

const results: Record<string, any> = {}
const step = async (name: string, fn: () => Promise<any>) => {
  try {
    const r = await fn()
    results[name] = { ok: true, data: r }
    console.log(`\n✓ ${name}\n` + JSON.stringify(r, null, 2))
    return r
  } catch (e: any) {
    results[name] = { ok: false, error: e?.message ?? String(e), raw: e?.raw }
    console.log(`\n✗ ${name}: ${e?.message ?? e}`)
    if (e?.raw) console.log(JSON.stringify(e.raw, null, 2))
    return null
  }
}

const VISA = { name: "John Wick", number: 4111111111111111, exp: "12/30", cvv: 999 }

async function main() {
  const ext = "smoke-" + process.env.RUN_ID

  // 1. Hosted Fields token (no money)
  await step("hostedFieldsToken", () =>
    card.createHostedFieldsToken({ domain: "https://kadimapayments.com", saveCard: "optional" })
  )

  // 2. Zero-dollar card validity check
  await step("cardAuthentication", () =>
    card.cardAuthentication({ amount: 0, card: VISA, externalId: ext + "-cardauth" })
  )

  // 3. Tokenize a card (generate-token)
  const tok = await step("generateToken", () =>
    card.generateToken({ amount: 0, card: VISA })
  )

  // 4. Auth-only with raw test card
  const auth = await step("auth", () =>
    card.auth({ amount: 12.34, card: VISA, externalId: ext + "-auth" })
  )

  // 5. Capture the auth
  if (auth?.id) await step("capture", () => card.capture(auth.id))

  // 6. Refund the captured txn
  if (auth?.id) await step("refund", () => card.refund(auth.id, 12.34))

  // 7. Sale with a saved token (if tokenization returned one)
  const savedToken = tok?.card?.token
  if (savedToken)
    await step("saleWithToken", () =>
      card.sale({ amount: 5.55, cardToken: savedToken, externalId: ext + "-saletoken" })
    )

  // 8. ACH debit (sandbox test bank account)
  const debit = await step("achDebit", () =>
    ach.debit({
      amount: 9.99,
      tax: 0,
      secCode: "PPD",
      accountName: "John Wick",
      accountNumber: "1234567890",
      routingNumber: "021000021", // checksum-valid ABA (JPMorgan Chase)
      accountType: "Checking",
      customer: { email: "demo@kadimapayments.com", identifier: ext + "-ach" },
    })
  )

  // 9. Read the ACH record back
  if (debit?.id) await step("achGet", () => ach.get(debit.id))

  // 10. Void the ACH (still Pending/Submitted)
  if (debit?.id) await step("achVoid", () => ach.action(debit.id, "void"))

  // 11. CustomerVault: create customer
  const cust = await step("vaultCreateCustomer", () =>
    vault.createCustomer({
      firstName: "Demo",
      lastName: "Merchant",
      email: "vault@kadimapayments.com",
      phone: "+18187740010",
      identificator: ext + "-vault",
    })
  )

  // 12. Create a billing record (required before adding a card)
  const billing =
    cust?.id &&
    (await step("vaultCreateBilling", () =>
      vault.createBilling(cust.id, {
        firstName: "Demo",
        lastName: "Merchant",
        address: "8320 Some Ave",
        city: "Calabasas",
        state: "CA",
        country: "US",
        zip: "85284",
      })
    ))

  // 13. Add a card to the vault customer (references billing.id)
  if (cust?.id && billing?.id)
    await step("vaultAddCard", () =>
      vault.addCard(cust.id, {
        number: "4111111111111111",
        exp: "12/30",
        cvv: 999,
        holderName: "Demo Merchant",
        billingId: billing.id,
      })
    )

  // 14. List the vault customer's cards
  if (cust?.id) await step("vaultListCards", () => vault.listCards(cust.id))

  console.log("\n\n===== SUMMARY =====")
  for (const [k, v] of Object.entries(results)) {
    console.log(`${v.ok ? "✓" : "✗"} ${k}`)
  }
  // emit machine-readable results for the report
  const fs = await import("fs")
  fs.writeFileSync(
    new URL("./sandbox-results.json", import.meta.url),
    JSON.stringify(results, null, 2)
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
