/**
 * Kadima Integration Console — backend proxy.
 *
 * Holds the per-merchant API token server-side (never exposed to the browser)
 * and proxies to the verified clients. Also receives Kadima webhooks, verifies
 * their SHA-512 signature, and streams them to the console.
 *
 * Run: KADIMA_TOKEN=... KADIMA_WEBHOOK=... npx tsx ui/server.ts
 * Then open http://localhost:4242
 *
 * This is a standalone demo console; the same endpoints can be ported into the
 * Kadima ops dashboard as admin routes later.
 */
import { createServer } from "http"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import { dirname, join, extname } from "path"
import { KadimaCardClient } from "../src/lib/kadima-card-client"
import { KadimaAchClient } from "../src/lib/kadima-ach-client"
import { KadimaVaultClient } from "../src/lib/kadima-vault-client"
import { verifySignature } from "../src/lib/webhook"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 4242)

const cfg = {
  apiToken: process.env.KADIMA_TOKEN ?? "",
  webhookSecret: process.env.KADIMA_WEBHOOK ?? "",
  terminalId: Number(process.env.KADIMA_TERMINAL ?? 404),
  dbaId: Number(process.env.KADIMA_DBA ?? 466),
  sandbox: true as const,
}
const card = new KadimaCardClient(cfg)
const ach = new KadimaAchClient({ ...cfg, secCode: "PPD" })
const vault = new KadimaVaultClient(cfg)

// In-memory webhook event log (most recent first).
const webhookLog: any[] = []

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
}

const json = (res: any, code: number, body: unknown) => {
  res.writeHead(code, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}
const readBody = (req: any): Promise<any> =>
  new Promise((resolve) => {
    let d = ""
    req.on("data", (c: any) => (d += c))
    req.on("end", () => {
      try {
        resolve(d ? JSON.parse(d) : {})
      } catch {
        resolve({})
      }
    })
  })

const wrap = async (res: any, fn: () => Promise<any>) => {
  try {
    json(res, 200, { ok: true, data: await fn() })
  } catch (e: any) {
    json(res, 200, { ok: false, error: e?.message ?? String(e), raw: e?.raw })
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const p = url.pathname
  const m = req.method ?? "GET"

  // ---- API ----
  if (p.startsWith("/api/")) {
    const body = m === "POST" ? await readBody(req) : {}

    // config (non-secret) for the UI header
    if (p === "/api/config")
      return json(res, 200, {
        terminalId: cfg.terminalId,
        dbaId: cfg.dbaId,
        sandbox: cfg.sandbox,
        merchant: "Kadima Payments Demo Merchant",
        hasToken: Boolean(cfg.apiToken),
      })

    if (p === "/api/hf-token" && m === "POST")
      return wrap(res, () =>
        card.createHostedFieldsToken({
          domain: body.domain ?? `http://localhost:${PORT}`,
          saveCard: body.saveCard ?? "optional",
          threeds: body.threeds ?? false,
        })
      )

    if (p === "/api/card/card-auth" && m === "POST")
      return wrap(res, () => card.cardAuthentication({ amount: 0, card: body.card, externalId: body.externalId }))
    if (p === "/api/card/generate-token" && m === "POST")
      return wrap(res, () => card.generateToken({ amount: 0, card: body.card }))
    if (p === "/api/card/auth" && m === "POST")
      return wrap(res, () => card.auth(body))
    if (p === "/api/card/sale" && m === "POST")
      return wrap(res, () => card.sale(body))
    if (p.match(/^\/api\/card\/\d+\/capture$/) && m === "POST")
      return wrap(res, () => card.capture(p.split("/")[3], body.amount))
    if (p.match(/^\/api\/card\/\d+\/refund$/) && m === "POST")
      return wrap(res, () => card.refund(p.split("/")[3], body.amount))

    if (p === "/api/ach/debit" && m === "POST") return wrap(res, () => ach.debit(body))
    if (p === "/api/ach/credit" && m === "POST") return wrap(res, () => ach.credit(body))
    if (p.match(/^\/api\/ach\/\d+$/) && m === "GET")
      return wrap(res, () => ach.get(p.split("/")[3]))
    if (p.match(/^\/api\/ach\/\d+\/(void|cancel|verify)$/) && m === "POST")
      return wrap(res, () => ach.action(p.split("/")[3], p.split("/")[4] as any))

    if (p === "/api/vault/customer" && m === "POST")
      return wrap(res, () => vault.createCustomer(body))
    if (p.match(/^\/api\/vault\/\d+\/billing$/) && m === "POST")
      return wrap(res, () => vault.createBilling(p.split("/")[3], body))
    if (p.match(/^\/api\/vault\/\d+\/card$/) && m === "POST")
      return wrap(res, () => vault.addCard(p.split("/")[3], body))
    if (p.match(/^\/api\/vault\/\d+\/cards$/) && m === "GET")
      return wrap(res, () => vault.listCards(p.split("/")[3]))

    // Webhook receiver — verify signature, log, return events to the console.
    if (p === "/api/webhooks/kadima" && m === "POST") {
      const sig = (req.headers["webhook-signature"] as string) || ""
      const valid = verifySignature(cfg.webhookSecret, body, sig)
      const entry = { receivedAt: new Date().toISOString(), valid, event: body }
      webhookLog.unshift(entry)
      return json(res, 200, { received: true, valid })
    }
    if (p === "/api/webhooks/log" && m === "GET")
      return json(res, 200, { items: webhookLog.slice(0, 50) })

    return json(res, 404, { ok: false, error: "Unknown endpoint" })
  }

  // ---- static ----
  let file = p === "/" ? "/index.html" : p
  try {
    const full = file.startsWith("/assets/")
      ? join(__dirname, file)
      : join(__dirname, "public", file)
    const data = await readFile(full)
    res.writeHead(200, { "Content-Type": MIME[extname(full)] ?? "application/octet-stream" })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end("Not found")
  }
})

server.listen(PORT, () => {
  console.log(`\n  Kadima Integration Console → http://localhost:${PORT}`)
  console.log(`  Merchant: Demo (terminal ${cfg.terminalId}, dba ${cfg.dbaId}, sandbox)`)
  console.log(`  Token loaded: ${cfg.apiToken ? "yes" : "NO — set KADIMA_TOKEN"}\n`)
})
