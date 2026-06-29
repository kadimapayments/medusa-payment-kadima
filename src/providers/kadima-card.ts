import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
  ListPaymentMethodsInput,
  ListPaymentMethodsOutput,
  SavePaymentMethodInput,
  SavePaymentMethodOutput,
} from "@medusajs/framework/types"
import { KadimaCardClient } from "../lib/kadima-card-client"
import { KadimaVaultClient } from "../lib/kadima-vault-client"
import { verifySignature } from "../lib/webhook"
import { KadimaCardOptions, CARD_HOSTS, DASHBOARD_HOSTS } from "../types"

/**
 * Card provider. Synchronous. Merchant = terminal.id. Capture model is
 * configurable per store (options.captureMethod: "auth" | "sale").
 *
 * Card collection is via Hosted Fields (SAQ-A) for new cards; server-to-server
 * charges use a stored CustomerVault `card.token`. Saved cards / account holders
 * use the CustomerVault (requires options.dbaId).
 */
class KadimaCardProviderService extends AbstractPaymentProvider<KadimaCardOptions> {
  static identifier = "kadima-card"

  protected client: KadimaCardClient
  protected vault: KadimaVaultClient
  protected options_: KadimaCardOptions

  constructor(container: Record<string, unknown>, options: KadimaCardOptions) {
    super(container, options)
    this.options_ = options
    this.client = new KadimaCardClient(options)
    this.vault = new KadimaVaultClient(options)

    // Startup diagnostics — makes credential/env mismatches obvious in deploy logs.
    // (A 401 from Kadima almost always means sandbox≠where-the-token-lives, or token=MISSING.)
    const sb = !!options.sandbox
    console.info(
      `[kadima-card] init — sandbox=${sb} · gateway=${sb ? CARD_HOSTS.sandbox : CARD_HOSTS.prod} · ` +
        `dashboard=${sb ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod} · ` +
        `terminal=${options.terminalId ?? "(unset)"} · token=${options.apiToken ? "set" : "MISSING"}`
    )
  }

  /**
   * No money moves. Mint a Hosted Fields token so the storefront can collect the
   * card client-side. The returned `data` is public — only the HF token + terminal.
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    // Hosted Fields locks the card iframe to a domain — it's REQUIRED on the
    // token mint, and a mismatch throws `hostedFields.error: "Invalid Domain"`.
    // Resolve from per-session data, else the configured storeUrl. Fail fast
    // with an actionable message instead of a cryptic iframe error later.
    let domain = (input.data?.domain as string) || this.options_.storeUrl || ""
    if (!domain) {
      throw new Error(
        '[kadima-card] Hosted Fields needs your storefront domain. Set `storeUrl` ' +
          '(e.g. KADIMA_STORE_URL="https://shop.example.com") on the kadima-card ' +
          "provider, or pass data.domain when creating the payment session."
      )
    }
    if (!/^https?:\/\//i.test(domain)) domain = "https://" + domain

    const sb = !!this.options_.sandbox
    const hf = await this.client.createHostedFieldsToken({
      domain,
      saveCard: input.context?.account_holder ? "optional" : "disabled",
    })
    return {
      // No Kadima transaction exists yet; use a local placeholder id.
      id: `kadima_hf_${hf.access_token.slice(-12)}`,
      data: {
        hostedFieldsToken: hf.access_token,
        terminalId: this.options_.terminalId,
        amount: input.amount,
        currency_code: input.currency_code,
        // Load the HostedFields.js that matches the token's environment, so a
        // sandbox token isn't sent to the production asset (and vice-versa).
        hfScriptUrl: `${sb ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod}/js/HostedFields.js`,
      },
    }
  }

  /**
   * Two paths (see docs/storefront/hosted-fields-example.md):
   *
   *  A) Hosted Fields (new card): the BROWSER already performed the payment. No
   *     card token reaches us. We return `pending` and let the `transaction/create`
   *     webhook (keyed by externalId === session_id) authorize the session.
   *
   *  B) Server-to-server (stored CustomerVault token / recurring / MOTO): we hold
   *     a reusable card token and charge directly. captureMethod=auth → /payment/auth;
   *     =sale → /payment/sale.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const cardToken = input.data?.cardToken as string | undefined
    const sessionId = input.data?.session_id as string

    // Path A — Hosted Fields. Browser charged; reconcile via webhook.
    if (!cardToken) {
      return { status: "pending", data: { ...input.data, externalId: sessionId } }
    }

    // Path B — server-to-server vault charge.
    const amount = Number(input.data?.amount)
    const method = this.options_.captureMethod ?? "auth"
    const txn =
      method === "sale"
        ? await this.client.sale({ amount, cardToken, externalId: sessionId })
        : await this.client.auth({ amount, cardToken, externalId: sessionId })

    return {
      status: method === "sale" ? "captured" : "authorized",
      data: { id: txn.id, captured: txn.captured, raw: txn },
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const id = String(input.data?.id)
    if (input.data?.captured) return { data: input.data } // already a sale
    const txn = await this.client.capture(id)
    return { data: { ...input.data, captured: txn.captured, raw: txn } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const id = String(input.data?.id)
    const txn = await this.client.refund(id, Number(input.amount))
    return { data: { ...input.data, refundId: txn.id, raw: txn } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const id = String(input.data?.id)
    // Pre-capture cancel = full reversal via the refund endpoint.
    const txn = await this.client.refund(id)
    return { data: { ...input.data, canceled: true, raw: txn } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const d = input.data ?? {}
    if (d.refundId) return { status: "captured", data: d }
    if (d.captured) return { status: "captured", data: d }
    if (d.id) return { status: "authorized", data: d }
    return { status: "pending", data: d }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Amount changed before authorization — re-mint HF token with new amount.
    return { data: { ...input.data, amount: input.amount } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  // --- Account holders & saved cards (CustomerVault) -----------------------

  /** Create a CustomerVault customer for this Medusa customer. */
  async createAccountHolder(
    input: CreateAccountHolderInput
  ): Promise<CreateAccountHolderOutput> {
    const c = input.context.customer
    const customer = await this.vault.createCustomer({
      firstName: c.first_name ?? undefined,
      lastName: c.last_name ?? undefined,
      company: c.company_name ?? undefined,
      email: c.email,
      phone: c.phone ?? undefined,
      identificator: c.id, // Medusa customer id
    })
    return { id: String(customer.id), data: { ...customer } }
  }

  async deleteAccountHolder(
    input: DeleteAccountHolderInput
  ): Promise<DeleteAccountHolderOutput> {
    const id = input.context.account_holder?.data?.id as string | undefined
    if (id) await this.vault.deleteCustomer(id)
    return {}
  }

  async listPaymentMethods(
    input: ListPaymentMethodsInput
  ): Promise<ListPaymentMethodsOutput> {
    const customerId = input.context?.account_holder?.data?.id as string | undefined
    if (!customerId) return []
    const { items } = await this.vault.listCards(customerId)
    return (items ?? []).map((card) => ({
      // The card token is the id we charge with later (card.token).
      id: card.token,
      data: { ...card },
    }))
  }

  /**
   * Save a card to the vault. Two inputs are supported in `data`:
   *  - raw card { number, exp, cvv, holderName }  → POST .../card (PCI-scoped)
   *  - an already-tokenized card { token }        → stored as-is (from Hosted
   *    Fields card-token, since there is no attach-token-to-vault endpoint)
   */
  async savePaymentMethod(
    input: SavePaymentMethodInput
  ): Promise<SavePaymentMethodOutput> {
    const data = (input.data ?? {}) as Record<string, any>
    const customerId = input.context?.account_holder?.data?.id as string | undefined

    if (data.token && !data.number) {
      return { id: data.token as string, data }
    }
    if (!customerId) {
      throw new Error("savePaymentMethod requires an account holder (vault customer)")
    }
    const card = await this.vault.addCard(customerId, {
      number: data.number,
      exp: data.exp,
      cvv: data.cvv,
      holderName: data.holderName,
    })
    return { id: card.token, data: { ...card } }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const data = payload.data as Record<string, any>
    const headers = payload.headers as Record<string, string>
    const ok = verifySignature(
      this.options_.webhookSecret,
      {
        id: data.id,
        module: data.module,
        action: data.action,
        date: data.date,
      },
      headers["webhook-signature"] || headers["Webhook-Signature"]
    )
    if (!ok || data.module !== "transaction") {
      return { action: "not_supported" }
    }
    // session_id round-trips as `externalId` on the transaction object.
    const txn = (data.data ?? {}) as Record<string, any>
    const session_id = (txn.externalId as string) ?? ""
    const amount = new BigNumber(Number(txn.amount ?? 0))

    switch (data.action) {
      case "create": {
        // Captured if it was a sale (captureMethod="sale"); else just authorized.
        const action = txn.captured ? "captured" : "authorized"
        return { action, data: { session_id, amount } }
      }
      case "refund":
        return { action: "captured", data: { session_id, amount } }
      default:
        // "reccuring" [sic], "highRiskAuthorizationWarning" → no session action
        return { action: "not_supported" }
    }
  }
}

export default KadimaCardProviderService
