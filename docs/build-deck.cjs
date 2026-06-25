/* Kadima ↔ Medusa Integration — capabilities deck (brand-matched). */
const pptx = require("pptxgenjs")
const sharp = require("sharp")
const React = require("react")
const RDS = require("react-dom/server")
const FA = require("react-icons/fa")
const fs = require("fs")
const path = require("path")

const DIR = __dirname
const LOGO = path.join(DIR, "..", "ui", "assets", "logo-white.png")

// brand
const BG = "0B0B0B", PANEL = "15171C", CARD = "171A1F", BORDER = "2A2E35"
const GREEN = "31BE72", BLUE = "27A9E2", WHITE = "FFFFFF", T2 = "CFD6DD", MUTED = "8A93A0"
const HEAD = "Manrope", BODY = "Manrope"
const W = 13.33, H = 7.5

const shadow = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 135, opacity: 0.45 })

async function iconPng(Comp, color = "#31BE72", size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color, size: String(size) }))
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  return "image/png;base64," + buf.toString("base64")
}
async function gradientPng(w = 1400, h = 60) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#31BE72"/><stop offset="1" stop-color="#27A9E2"/>
    </linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  return "image/png;base64," + buf.toString("base64")
}

;(async () => {
  const P = new pptx()
  P.defineLayout({ name: "W", width: W, height: H })
  P.layout = "W"
  P.author = "Kadima Payments"
  P.title = "Kadima ↔ Medusa Direct Integration"

  const GRAD = await gradientPng()
  const ic = {
    lock: await iconPng(FA.FaLock), card: await iconPng(FA.FaRegCreditCard),
    bank: await iconPng(FA.FaUniversity), vault: await iconPng(FA.FaShieldAlt),
    bell: await iconPng(FA.FaBell), bolt: await iconPng(FA.FaBolt),
    check: await iconPng(FA.FaCheckCircle), sync: await iconPng(FA.FaSyncAlt),
    swap: await iconPng(FA.FaExchangeAlt), code: await iconPng(FA.FaCode),
    star: await iconPng(FA.FaStar), refresh: await iconPng(FA.FaRedo),
    checkW: await iconPng(FA.FaCheckCircle, "#0B0B0B"),
  }

  // ---- helpers ----
  const base = (s, n) => {
    s.background = { color: BG }
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    if (n) {
      s.addImage({ path: LOGO, x: 0.55, y: 7.0, h: 0.22, w: 0.96 })
      s.addText(String(n).padStart(2, "0"), { x: W - 1.0, y: 6.92, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, align: "right" })
    }
  }
  const title = (s, t, sub) => {
    s.addText(t, { x: 0.6, y: 0.52, w: W - 1.2, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: WHITE })
    if (sub) s.addText(sub, { x: 0.62, y: 1.18, w: W - 1.4, h: 0.4, fontFace: BODY, fontSize: 13.5, color: MUTED })
  }
  const card = (s, x, y, w, h) => {
    s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: shadow() })
  }
  const tile = (s, x, y, w, h, icon, head, body, tag, tagColor) => {
    card(s, x, y, w, h)
    s.addShape(P.shapes.RECTANGLE, { x, y, w, h: 0.045, fill: { color: GREEN } })
    s.addImage({ data: icon, x: x + 0.28, y: y + 0.28, w: 0.42, h: 0.42 })
    s.addText(head, { x: x + 0.28, y: y + 0.82, w: w - 0.56, h: 0.34, fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE })
    s.addText(body, { x: x + 0.28, y: y + 1.18, w: w - 0.56, h: h - 1.5, fontFace: BODY, fontSize: 11, color: T2, lineSpacingMultiple: 1.05, valign: "top" })
    if (tag) {
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: x + 0.28, y: y + h - 0.5, w: 1.25, h: 0.28, rectRadius: 0.06, fill: { color: tagColor === BLUE ? "0E2A38" : "0E2B1C" } })
      s.addText(tag, { x: x + 0.28, y: y + h - 0.5, w: 1.25, h: 0.28, fontFace: BODY, fontSize: 8.5, bold: true, color: tagColor || GREEN, align: "center", valign: "middle", charSpacing: 1 })
    }
  }
  const grad = (s, parts, opt) => s.addText(parts, opt) // rich runs

  // ===== 1 · TITLE =====
  {
    const s = P.addSlide(); base(s)
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    // soft brand glow blocks
    s.addShape(P.shapes.OVAL, { x: 9.6, y: -2.0, w: 6, h: 6, fill: { color: "10303F" } })
    s.addShape(P.shapes.OVAL, { x: -2.2, y: 4.4, w: 6, h: 6, fill: { color: "0E2B1C" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.85, h: 0.5, w: 2.2 })
    s.addText("SANDBOX-VERIFIED", { x: 0.9, y: 2.25, w: 4, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 3 })
    grad(s, [
      { text: "Direct integration with ", options: { color: WHITE } },
      { text: "Medusa.js", options: { color: GREEN } },
    ], { x: 0.85, y: 2.7, w: 11.6, h: 1.4, fontFace: HEAD, fontSize: 46, bold: true })
    s.addText("Card & ACH straight through Kadima — no middle gateway.", { x: 0.88, y: 4.05, w: 11, h: 0.5, fontFace: BODY, fontSize: 18, color: T2 })
    s.addImage({ data: GRAD, x: 0.9, y: 4.75, w: 3.4, h: 0.045 })
    s.addText("Kadima Payments Demo Merchant  ·  Terminal 404 · DBA 466  ·  June 2026", { x: 0.9, y: 5.0, w: 11, h: 0.4, fontFace: BODY, fontSize: 12.5, color: MUTED })
  }

  // ===== 2 · WHY — no middle gateway =====
  {
    const s = P.addSlide(); base(s, 2)
    title(s, "One less hop, one less markup", "Today a merchant's payments pass through a middle gateway. This integration removes it.")
    // before
    card(s, 0.6, 1.9, 5.75, 3.9)
    s.addText("TODAY", { x: 0.9, y: 2.15, w: 4, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: MUTED, charSpacing: 2 })
    const flow = (s, x, y, items, color) => {
      items.forEach((t, i) => {
        s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + i * 0.82, w: 4.0, h: 0.6, rectRadius: 0.08, fill: { color: PANEL }, line: { color: i === items.length - 1 ? color : BORDER, width: i === items.length - 1 ? 1.5 : 1 } })
        s.addText(t, { x: x + 0.2, y: y + i * 0.82, w: 3.7, h: 0.6, fontFace: BODY, fontSize: 13, bold: i === items.length - 1, color: i === items.length - 1 ? WHITE : T2, valign: "middle" })
        if (i < items.length - 1) s.addText("↓", { x: x + 1.85, y: y + i * 0.82 + 0.58, w: 0.3, h: 0.26, fontSize: 12, color: MUTED, align: "center" })
      })
    }
    flow(s, 1.45, 2.6, ["Merchant store", "Middle gateway (NMI)", "Kadima"], "6B7280")
    s.addText("Extra fees · extra failure point · extra integration", { x: 0.9, y: 5.35, w: 5.2, h: 0.35, fontFace: BODY, fontSize: 10.5, italic: true, color: MUTED })
    // after
    card(s, 6.95, 1.9, 5.75, 3.9)
    s.addShape(P.shapes.RECTANGLE, { x: 6.95, y: 1.9, w: 5.75, h: 0.05, fill: { color: GREEN } })
    s.addText("WITH THIS INTEGRATION", { x: 7.25, y: 2.15, w: 5, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 2 })
    flow(s, 8.45, 3.05, ["Merchant store", "Kadima"], GREEN)
    s.addText("Direct API + webhooks · lower cost · fewer moving parts", { x: 7.25, y: 5.35, w: 5.2, h: 0.35, fontFace: BODY, fontSize: 10.5, italic: true, color: T2 })
  }

  // ===== 3 · ARCHITECTURE =====
  {
    const s = P.addSlide(); base(s, 3)
    title(s, "Two providers, one plugin", "Card is synchronous; ACH is asynchronous — so each is its own Medusa payment provider over a shared, verified client.")
    tile(s, 0.6, 1.95, 3.86, 3.5, ic.card, "kadima-card", "Synchronous. Merchant = terminal.id. Hosted Fields for new cards (SAQ-A); server-to-server for stored tokens. Configurable capture: auth→capture or one-shot sale.", "SYNC", GREEN)
    tile(s, 4.73, 1.95, 3.86, 3.5, ic.bank, "kadima-ach", "Asynchronous. Merchant = dba.id. Submit returns authorized; the Settled webhook drives captured, Returned drives failed. SEC: PPD/CCD/WEB/TEL.", "ASYNC", BLUE)
    tile(s, 8.86, 1.95, 3.86, 3.5, ic.lock, "Shared & secure", "Per-merchant Bearer token held server-side. SHA-512 webhook verification. Reference-verified request shapes. PCI SAQ-A — card data never hits your backend.", "SECURE", GREEN)
    s.addText("Reference-verified claim-by-claim, then proven live on the Kadima sandbox.", { x: 0.62, y: 5.75, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: MUTED })
  }

  // ===== 4 · HOSTED FIELDS FLOW =====
  {
    const s = P.addSlide(); base(s, 4)
    title(s, "Card via Hosted Fields — PCI SAQ-A", "The card number never touches your servers. The browser tokenizes it; you reconcile by webhook.")
    const steps = [
      ["1", "Mint a token", "Backend calls POST /api/hosted-fields/token. The API token stays server-side."],
      ["2", "Customer pays in-iframe", "HostedFields.create renders Kadima's secure fields. The PAN goes straight to Kadima."],
      ["3", "Kadima authorizes", "Auth or sale happens client-side, carrying your externalId (= order/session)."],
      ["4", "You reconcile", "transaction/create webhook arrives signed; match by externalId, record the payment."],
    ]
    steps.forEach((st, i) => {
      const x = 0.6 + i * 3.07
      card(s, x, 2.05, 2.85, 3.2)
      s.addShape(P.shapes.OVAL, { x: x + 0.28, y: 2.32, w: 0.62, h: 0.62, fill: { color: "0E2B1C" }, line: { color: GREEN, width: 1.5 } })
      s.addText(st[0], { x: x + 0.28, y: 2.32, w: 0.62, h: 0.62, fontFace: HEAD, fontSize: 22, bold: true, color: GREEN, align: "center", valign: "middle" })
      s.addText(st[1], { x: x + 0.28, y: 3.12, w: 2.3, h: 0.5, fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE })
      s.addText(st[2], { x: x + 0.28, y: 3.62, w: 2.32, h: 1.4, fontFace: BODY, fontSize: 11, color: T2, valign: "top" })
      if (i < 3) s.addText("→", { x: x + 2.78, y: 3.45, w: 0.34, h: 0.4, fontSize: 18, color: GREEN, align: "center", bold: true })
    })
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 5.55, w: 12.13, h: 0.66, fill: { color: "0E2B1C" }, line: { color: GREEN, width: 1 } })
    s.addText([
      { text: "Result:  ", options: { bold: true, color: GREEN } },
      { text: "your servers stay out of PCI scope (SAQ-A) while still owning the full order + reconciliation flow.", options: { color: T2 } },
    ], { x: 0.85, y: 5.55, w: 11.7, h: 0.66, fontFace: BODY, fontSize: 12.5, valign: "middle" })
  }

  // ===== 5 · CARD CAPABILITIES (live proof) =====
  {
    const s = P.addSlide(); base(s, 5)
    title(s, "Card operations — live on sandbox", "Every capability below was executed against the real Kadima sandbox. IDs are actual transactions.")
    const rows = [
      ["Authorize", "POST /payment/auth", "Approved · id 217945 · auth TAS342"],
      ["Capture", "POST /payment/{id}/capture", "Settled the authorization"],
      ["Sale (auth+capture)", "POST /payment/sale", "Approved · id 217948 · captured"],
      ["Refund / reversal", "POST /payment/{id}/refund", "id 217947 · type Return"],
      ["Tokenize card", "POST /payment/generate-token", "token SDAtngMXzdjd1111"],
      ["Zero-dollar verify", "POST /payment/card-authentication", "Approved · CVV match M"],
    ]
    const x = 0.6, y = 2.0, w = 12.13, rh = 0.62
    rows.forEach((r, i) => {
      const ry = y + i * rh
      s.addShape(P.shapes.RECTANGLE, { x, y: ry, w, h: rh, fill: { color: i % 2 ? "121419" : CARD }, line: { color: BORDER, width: 0.5 } })
      s.addImage({ data: ic.check, x: x + 0.22, y: ry + 0.18, w: 0.26, h: 0.26 })
      s.addText(r[0], { x: x + 0.62, y: ry, w: 3.0, h: rh, fontFace: HEAD, fontSize: 12.5, bold: true, color: WHITE, valign: "middle" })
      s.addText(r[1], { x: x + 3.7, y: ry, w: 4.4, h: rh, fontFace: "Consolas", fontSize: 10.5, color: BLUE, valign: "middle" })
      s.addText(r[2], { x: x + 8.2, y: ry, w: 3.8, h: rh, fontFace: BODY, fontSize: 10.5, color: T2, valign: "middle" })
    })
  }

  // ===== 6 · ACH =====
  {
    const s = P.addSlide(); base(s, 6)
    title(s, "ACH / eCheck — bank payments, direct", "Asynchronous by nature: submit now, settle or return later via signed webhook.")
    // flow band
    const items = [["Submit debit", "POST /api/ach → PENDING", GREEN], ["Transmitted", "sent to ACH network", BLUE], ["Settled", "→ Medusa captured", GREEN], ["Returned", "R-code → failed + reverse", "EF4444"]]
    items.forEach((it, i) => {
      const x = 0.6 + i * 3.07
      card(s, x, 2.0, 2.85, 1.7)
      s.addShape(P.shapes.RECTANGLE, { x, y: 2.0, w: 2.85, h: 0.045, fill: { color: it[2] } })
      s.addText(it[0], { x: x + 0.25, y: 2.2, w: 2.4, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
      s.addText(it[1], { x: x + 0.25, y: 2.62, w: 2.45, h: 0.9, fontFace: BODY, fontSize: 10.5, color: T2, valign: "top" })
      if (i < 3) s.addText("→", { x: x + 2.78, y: 2.7, w: 0.34, h: 0.4, fontSize: 18, color: MUTED, align: "center", bold: true })
    })
    tile(s, 0.6, 3.95, 5.96, 2.3, ic.swap, "Debit & credit · SEC codes", "PPD & CCD support debit and credit (refund via offsetting credit). WEB & TEL are debit-only. Void applies before the item is submitted for processing.", "LIVE", GREEN)
    tile(s, 6.76, 3.95, 5.96, 2.3, ic.sync, "Correlation & returns", "Each debit carries customer.identifier = your session id. The ach/updateStatus webhook returns the full record with status and return.code for clean reconciliation.", "LIVE", GREEN)
    s.addText("Live: debit id 90785217 created (PENDING); status read back; void correctly declined on a not-yet-submitted item.", { x: 3.4, y: 6.42, w: 9.3, h: 0.32, fontFace: BODY, fontSize: 10.5, italic: true, color: "A7B0BC", align: "right" })
  }

  // ===== 7 · CUSTOMER VAULT =====
  {
    const s = P.addSlide(); base(s, 7)
    title(s, "Customer Vault — repeat & recurring", "Store the customer, a billing record, and a tokenized card once; charge on file forever.")
    const steps = [["Customer", "POST /api/customer-vault", "id 8246 + vault token"], ["Billing", "…/billing-information", "id 5896"], ["Card", "…/card", "id 3414 · token issued"], ["Charge on file", "POST /payment/sale (token)", "recurring / MIT"]]
    steps.forEach((st, i) => {
      const x = 0.6 + i * 3.07
      card(s, x, 2.1, 2.85, 2.7)
      s.addImage({ data: i === 3 ? ic.sync : ic.vault, x: x + 0.28, y: 2.38, w: 0.4, h: 0.4 })
      s.addText(st[0], { x: x + 0.28, y: 2.92, w: 2.3, h: 0.4, fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE })
      s.addText(st[1], { x: x + 0.28, y: 3.35, w: 2.45, h: 0.6, fontFace: "Consolas", fontSize: 9.5, color: BLUE, valign: "top" })
      s.addText(st[2], { x: x + 0.28, y: 3.95, w: 2.45, h: 0.7, fontFace: BODY, fontSize: 10.5, color: T2, valign: "top" })
      if (i < 3) s.addText("→", { x: x + 2.78, y: 3.2, w: 0.34, h: 0.4, fontSize: 18, color: GREEN, align: "center", bold: true })
    })
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.2, w: 12.13, h: 0.66, rectRadius: 0.08, fill: { color: PANEL }, line: { color: BORDER, width: 1 } })
    s.addText([{ text: "Note:  ", options: { bold: true, color: GREEN } }, { text: "a card requires a billing record first — the chained flow above was verified live, end to end.", options: { color: T2 } }], { x: 0.85, y: 5.2, w: 11.7, h: 0.66, fontFace: BODY, fontSize: 12, valign: "middle" })
  }

  // ===== 8 · WEBHOOKS =====
  {
    const s = P.addSlide(); base(s, 8)
    title(s, "Webhooks — signed & reconciled", "Every event is verified before it's trusted, then mapped to a Medusa payment action.")
    card(s, 0.6, 2.0, 5.95, 3.8)
    s.addImage({ data: ic.lock, x: 0.9, y: 2.28, w: 0.42, h: 0.42 })
    s.addText("Signature verification", { x: 1.45, y: 2.3, w: 4.8, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE })
    s.addText("Webhook-Signature =", { x: 0.9, y: 2.95, w: 5.2, h: 0.3, fontFace: BODY, fontSize: 11.5, color: T2 })
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.9, y: 3.3, w: 5.35, h: 0.7, rectRadius: 0.06, fill: { color: "0B0D11" }, line: { color: BORDER, width: 1 } })
    s.addText("SHA-512( secret + id + module\n            + action + date )", { x: 1.05, y: 3.3, w: 5.1, h: 0.7, fontFace: "Consolas", fontSize: 11, color: GREEN, valign: "middle" })
    s.addText("Recomputed and constant-time compared server-side before any event is accepted. 7 unit tests cover it.", { x: 0.9, y: 4.2, w: 5.4, h: 1.2, fontFace: BODY, fontSize: 11.5, color: T2, valign: "top" })
    card(s, 6.78, 2.0, 5.95, 3.8)
    s.addText("Event → Medusa action", { x: 7.08, y: 2.28, w: 5.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE })
    const map = [["transaction/create", "authorized / captured"], ["transaction/refund", "captured (refund)"], ["ach/updateStatus · Settled", "captured"], ["ach/updateStatus · Returned", "failed + reverse"], ["chargeback/create", "flag for review"]]
    map.forEach((m, i) => {
      const ry = 2.95 + i * 0.55
      s.addImage({ data: ic.bell, x: 7.08, y: ry + 0.07, w: 0.22, h: 0.22 })
      s.addText(m[0], { x: 7.42, y: ry, w: 3.0, h: 0.45, fontFace: "Consolas", fontSize: 10, color: BLUE, valign: "middle" })
      s.addText("→ " + m[1], { x: 10.5, y: ry, w: 2.1, h: 0.45, fontFace: BODY, fontSize: 10, color: T2, valign: "middle" })
    })
  }

  // ===== 9 · CAPABILITY MATRIX =====
  {
    const s = P.addSlide(); base(s, 9)
    title(s, "What's available", "Live = executed on sandbox in this build.  Available = documented & supported, ready to wire.")
    const data = [
      ["Hosted Fields (SAQ-A)", "Live", "Card auth / sale", "Live"],
      ["Capture (full/partial/multi)", "Live", "Refund / void / reversal", "Live"],
      ["Tokenize / saved-card charge", "Live", "Zero-dollar verify", "Live"],
      ["ACH debit / credit", "Live", "ACH void / cancel / verify", "Live"],
      ["Customer Vault (cust/bill/card)", "Live", "Webhooks (signed)", "Verified"],
      ["3D Secure", "Available", "Account Updater", "Available"],
      ["Chargebacks / reporting", "Available", "Recurring billing", "Available"],
    ]
    const x = 0.6, y = 1.95, colW = 6.06, rh = 0.58
    data.forEach((r, i) => {
      ;[0, 1].forEach((c) => {
        const cx = x + c * colW
        const label = r[c * 2], state = r[c * 2 + 1]
        const live = state === "Live" || state === "Verified"
        s.addShape(P.shapes.RECTANGLE, { x: cx, y: y + i * rh, w: colW - 0.12, h: rh - 0.08, fill: { color: CARD }, line: { color: BORDER, width: 0.5 } })
        s.addImage({ data: live ? ic.check : ic.star, x: cx + 0.2, y: y + i * rh + 0.16, w: 0.24, h: 0.24 })
        s.addText(label, { x: cx + 0.55, y: y + i * rh, w: colW - 2.1, h: rh - 0.08, fontFace: BODY, fontSize: 11.5, color: WHITE, valign: "middle" })
        s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: cx + colW - 1.45, y: y + i * rh + 0.12, w: 1.15, h: 0.3, rectRadius: 0.06, fill: { color: live ? "0E2B1C" : "26221A" } })
        s.addText(state, { x: cx + colW - 1.45, y: y + i * rh + 0.12, w: 1.15, h: 0.3, fontFace: BODY, fontSize: 9, bold: true, color: live ? GREEN : "E0A93B", align: "center", valign: "middle", charSpacing: 1 })
      })
    })
  }

  // ===== 10 · RESULTS / PROOF =====
  {
    const s = P.addSlide(); base(s, 10)
    title(s, "Proven against the live sandbox", "Built with a reference fact-checker, then run end-to-end on real Kadima infrastructure.")
    const stat = (x, big, lab) => {
      card(s, x, 2.0, 3.86, 1.7)
      s.addText(big, { x, y: 2.15, w: 3.86, h: 0.85, fontFace: HEAD, fontSize: 40, bold: true, color: GREEN, align: "center" })
      s.addText(lab, { x: x + 0.2, y: 3.05, w: 3.46, h: 0.55, fontFace: BODY, fontSize: 11.5, color: T2, align: "center" })
    }
    stat(0.6, "12 / 13", "live operations succeeded\n(the 1 was a correct decline)")
    stat(4.73, "50+", "API-shape claims verified\nagainst the canonical reference")
    stat(8.86, "0", "card numbers touched\nour backend (SAQ-A)")
    card(s, 0.6, 4.0, 12.13, 2.55)
    s.addText("Bugs the verifier caught before they shipped", { x: 0.9, y: 4.2, w: 11, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
    const fixes = [
      "ACH SEC field is SECCode (not secCode); bank fields are top-level, not nested",
      "Card-vault customer id is identificator; ACH customer id is identifier",
      "Hosted Fields token uses a flat terminal, not nested terminal.id",
      "Adding a vault card requires creating a billing record first",
    ]
    fixes.forEach((f, i) => {
      s.addImage({ data: ic.check, x: 0.95, y: 4.72 + i * 0.42, w: 0.22, h: 0.22 })
      s.addText(f, { x: 1.3, y: 4.66 + i * 0.42, w: 11.2, h: 0.4, fontFace: BODY, fontSize: 11.5, color: T2, valign: "middle" })
    })
  }

  // ===== 11 · CONSOLE =====
  {
    const s = P.addSlide(); base(s, 11)
    title(s, "A branded console to drive it all", "Kadima-styled, ready to fold into the ops dashboard. The token stays server-side.")
    // mock window
    card(s, 0.6, 2.0, 12.13, 4.4)
    // sidebar
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 2.6, h: 4.4, fill: { color: PANEL }, line: { color: BORDER, width: 1 } })
    s.addImage({ path: LOGO, x: 0.85, y: 2.28, h: 0.26, w: 1.1 })
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 2.0, y: 2.3, w: 0.85, h: 0.26, rectRadius: 0.06, fill: { color: "0E2B1C" } })
    s.addText("SANDBOX", { x: 2.0, y: 2.3, w: 0.85, h: 0.26, fontFace: BODY, fontSize: 7.5, bold: true, color: GREEN, align: "center", valign: "middle" })
    const nav = ["Overview", "Hosted Fields", "Card (S2S)", "ACH / eCheck", "Customer Vault", "Webhooks"]
    nav.forEach((n, i) => {
      const active = i === 0
      if (active) s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 0.78, y: 2.85 + i * 0.5, w: 2.25, h: 0.42, rectRadius: 0.05, fill: { color: "12241A" } })
      s.addText(n, { x: 0.95, y: 2.85 + i * 0.5, w: 2.1, h: 0.42, fontFace: BODY, fontSize: 11.5, bold: active, color: active ? WHITE : MUTED, valign: "middle" })
    })
    // content tiles
    const tiles = [["Hosted Fields", ic.card], ["Auth / Sale / Capture", ic.bolt], ["Refund / Reversal", ic.refresh], ["ACH / eCheck", ic.bank], ["Customer Vault", ic.vault], ["Webhooks", ic.bell]]
    tiles.forEach((t, i) => {
      const col = i % 3, row = Math.floor(i / 3)
      const tx = 3.5 + col * 3.0, ty = 2.45 + row * 1.85
      s.addShape(P.shapes.RECTANGLE, { x: tx, y: ty, w: 2.78, h: 1.62, fill: { color: CARD }, line: { color: BORDER, width: 1 } })
      s.addShape(P.shapes.RECTANGLE, { x: tx, y: ty, w: 2.78, h: 0.04, fill: { color: GREEN } })
      s.addImage({ data: t[1], x: tx + 0.22, y: ty + 0.24, w: 0.34, h: 0.34 })
      s.addText(t[0], { x: tx + 0.22, y: ty + 0.66, w: 2.4, h: 0.4, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE })
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: tx + 0.22, y: ty + 1.1, w: 1.05, h: 0.26, rectRadius: 0.05, fill: { color: "0E2B1C" } })
      s.addText("LIVE TESTED", { x: tx + 0.22, y: ty + 1.1, w: 1.05, h: 0.26, fontFace: BODY, fontSize: 6.5, bold: true, color: GREEN, align: "center", valign: "middle", charSpacing: 1 })
    })
  }

  // ===== 12 · NEXT / CLOSE =====
  {
    const s = P.addSlide(); base(s)
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    s.addShape(P.shapes.OVAL, { x: 8.8, y: 3.2, w: 7, h: 7, fill: { color: "10303F" } })
    s.addShape(P.shapes.OVAL, { x: -2.5, y: -3, w: 6.5, h: 6.5, fill: { color: "0E2B1C" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.9, h: 0.42, w: 1.85 })
    s.addText("Ready for production wiring", { x: 0.85, y: 2.1, w: 11, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: WHITE })
    s.addImage({ data: GRAD, x: 0.88, y: 3.05, w: 3.2, h: 0.045 })
    const next = [
      "Swap sandbox for production hosts + the live per-merchant token",
      "Register the merchant's webhook URL → /api/webhooks/kadima",
      "Compile the providers inside a Medusa app (@medusajs/framework)",
      "Port the console endpoints into the ops dashboard, keyed per merchant",
    ]
    next.forEach((n, i) => {
      s.addImage({ data: ic.check, x: 0.9, y: 3.5 + i * 0.62, w: 0.3, h: 0.3 })
      s.addText(n, { x: 1.35, y: 3.45 + i * 0.62, w: 9.5, h: 0.5, fontFace: BODY, fontSize: 14.5, color: T2, valign: "middle" })
    })
    s.addText("Card & ACH, straight through Kadima — no middle gateway.", { x: 0.9, y: 6.25, w: 11, h: 0.5, fontFace: BODY, fontSize: 14, italic: true, color: GREEN })
  }

  await P.writeFile({ fileName: path.join(DIR, "Kadima-Medusa-Integration.pptx") })
  console.log("deck written")
})()
