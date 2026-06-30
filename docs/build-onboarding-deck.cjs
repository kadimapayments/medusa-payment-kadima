/* Kadima ↔ Medusa — Onboarding & Usage guide (with real console screenshots). */
const pptx = require("pptxgenjs")
const sharp = require("sharp")
const React = require("react")
const RDS = require("react-dom/server")
const FA = require("react-icons/fa")
const path = require("path")

const DIR = __dirname
const LOGO = path.join(DIR, "..", "ui", "assets", "logo-white.png")
const SHOT = (n) => path.join(DIR, "shots", n)

const BG = "0B0B0B", PANEL = "15171C", CARD = "171A1F", BORDER = "2A2E35"
const GREEN = "31BE72", BLUE = "27A9E2", WHITE = "FFFFFF", T2 = "CFD6DD", MUTED = "8A93A0", CODEBG = "0B0D11"
const HEAD = "Manrope", BODY = "Manrope", MONO = "Consolas"
const W = 13.33, H = 7.5
const shadow = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 135, opacity: 0.45 })

async function iconPng(Comp, color = "#31BE72", size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color, size: String(size) }))
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  return "image/png;base64," + buf.toString("base64")
}
async function gradientPng(w = 1400, h = 60) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#31BE72"/><stop offset="1" stop-color="#27A9E2"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64")
}
const dims = async (p) => { const m = await sharp(p).metadata(); return m.width / m.height }

;(async () => {
  const P = new pptx()
  P.defineLayout({ name: "W", width: W, height: H }); P.layout = "W"
  P.author = "Kadima Payments"; P.title = "Kadima ↔ Medusa — Onboarding & Usage"
  const GRAD = await gradientPng()
  const ic = {
    key: await iconPng(FA.FaKey), plug: await iconPng(FA.FaPlug), bolt: await iconPng(FA.FaBolt),
    check: await iconPng(FA.FaCheckCircle), gear: await iconPng(FA.FaCog), bell: await iconPng(FA.FaBell),
    card: await iconPng(FA.FaRegCreditCard), bank: await iconPng(FA.FaUniversity), vault: await iconPng(FA.FaShieldAlt),
    id: await iconPng(FA.FaIdBadge), term: await iconPng(FA.FaDesktop), hook: await iconPng(FA.FaLink),
  }

  const base = (s, n) => {
    s.background = { color: BG }
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    if (n) {
      s.addImage({ path: LOGO, x: 0.55, y: 7.02, h: 0.2, w: 0.88 })
      s.addText(String(n).padStart(2, "0"), { x: W - 1.0, y: 6.94, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, align: "right" })
    }
  }
  const title = (s, t, sub) => {
    s.addText(t, { x: 0.6, y: 0.42, w: W - 1.2, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: WHITE })
    if (sub) s.addText(sub, { x: 0.62, y: 1.02, w: W - 1.4, h: 0.4, fontFace: BODY, fontSize: 13, color: MUTED })
  }
  const card = (s, x, y, w, h, fill) => s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill || CARD }, line: { color: BORDER, width: 1 }, shadow: shadow() })

  // framed screenshot contained in box (x,y,boxW,boxH), centered, with green top accent
  const screenshot = async (s, file, x, y, boxW, boxH) => {
    const a = await dims(SHOT(file))
    let w = boxW, h = w / a
    if (h > boxH) { h = boxH; w = h * a }
    const ix = x + (boxW - w) / 2, iy = y + (boxH - h) / 2
    s.addShape(P.shapes.RECTANGLE, { x: ix - 0.06, y: iy - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: "000000" }, line: { color: BORDER, width: 1 }, shadow: shadow() })
    s.addImage({ path: SHOT(file), x: ix, y: iy, w, h })
  }
  const steps = (s, x, y, w, items) => {
    items.forEach((it, i) => {
      const sy = y + i * (1.02)
      s.addShape(P.shapes.OVAL, { x, y: sy, w: 0.42, h: 0.42, fill: { color: "0E2B1C" }, line: { color: GREEN, width: 1.5 } })
      s.addText(String(i + 1), { x, y: sy, w: 0.42, h: 0.42, fontFace: HEAD, fontSize: 15, bold: true, color: GREEN, align: "center", valign: "middle" })
      s.addText(it[0], { x: x + 0.6, y: sy - 0.04, w: w - 0.6, h: 0.34, fontFace: HEAD, fontSize: 13.5, bold: true, color: WHITE })
      s.addText(it[1], { x: x + 0.6, y: sy + 0.3, w: w - 0.6, h: 0.66, fontFace: BODY, fontSize: 10.8, color: T2, valign: "top" })
    })
  }
  const codeBlock = (s, x, y, w, h, lines) => {
    s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: CODEBG }, line: { color: BORDER, width: 1 } })
    s.addText(lines.map((l, i) => ({ text: l.t, options: { color: l.c || T2, breakLine: i < lines.length - 1, bold: l.b } })),
      { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: h - 0.36, fontFace: MONO, fontSize: 11, valign: "top", lineSpacingMultiple: 1.12 })
  }

  // ===== 1 TITLE =====
  {
    const s = P.addSlide(); base(s)
    s.addShape(P.shapes.OVAL, { x: 9.4, y: -2.2, w: 6.4, h: 6.4, fill: { color: "10303F" } })
    s.addShape(P.shapes.OVAL, { x: -2.4, y: 4.2, w: 6.4, h: 6.4, fill: { color: "0E2B1C" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.9, h: 0.5, w: 2.2 })
    s.addText("ONBOARDING & USAGE GUIDE", { x: 0.9, y: 2.3, w: 8, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 3 })
    s.addText([{ text: "How to onboard a merchant\n", options: { color: WHITE } }, { text: "& use the integration", options: { color: GREEN } }],
      { x: 0.85, y: 2.75, w: 11.6, h: 1.7, fontFace: HEAD, fontSize: 42, bold: true, lineSpacingMultiple: 1.0 })
    s.addImage({ data: GRAD, x: 0.9, y: 4.75, w: 3.4, h: 0.045 })
    s.addText("Direct card & ACH through Kadima — no middle gateway.  ·  Live on sandbox.", { x: 0.9, y: 5.0, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, color: MUTED })
  }

  // ===== 2 IS IT COMPLETE? =====
  {
    const s = P.addSlide(); base(s, 2)
    title(s, "Where the integration stands", "The core is built and proven live. What remains is wiring it into a running store and shipping it.")
    card(s, 0.6, 1.7, 6.0, 4.85)
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 1.7, w: 6.0, h: 0.05, fill: { color: GREEN } })
    s.addText("✓  DONE — built & live-tested", { x: 0.9, y: 1.95, w: 5.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: GREEN })
    const done = ["Card client + Hosted Fields (SAQ-A)", "Auth · sale · capture · refund · tokenize · $0 verify", "ACH debit/credit + void/verify, SEC codes", "Customer Vault: customer → billing → saved card", "Webhook signature verify (SHA-512) + 7 unit tests", "Both Medusa providers (card sync / ACH async)", "Branded console + 12/13 live sandbox ops green"]
    done.forEach((d, i) => { s.addImage({ data: ic.check, x: 0.95, y: 2.5 + i * 0.55, w: 0.22, h: 0.22 }); s.addText(d, { x: 1.3, y: 2.44 + i * 0.55, w: 5.1, h: 0.45, fontFace: BODY, fontSize: 11.5, color: T2, valign: "middle" }) })
    card(s, 6.95, 1.7, 5.78, 4.85)
    s.addShape(P.shapes.RECTANGLE, { x: 6.95, y: 1.7, w: 5.78, h: 0.05, fill: { color: BLUE } })
    s.addText("◯  REMAINING — to go production", { x: 7.25, y: 1.95, w: 5.2, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: BLUE })
    const todo = [["Run inside a Medusa store", "Install the plugin in a Medusa app and compile the providers against @medusajs/framework."], ["Switch to production", "Swap sandbox hosts for gateway./kadimadashboard.com + the live per-merchant token."], ["Register the webhook URL", "Point each merchant's Kadima webhook at the deployed /api/webhooks/kadima."], ["Port into the ops dashboard", "Move the console endpoints into api/ops/…, keyed per merchant."]]
    todo.forEach((t, i) => { const y = 2.5 + i * 1.0; s.addText("•", { x: 7.28, y, w: 0.3, h: 0.3, fontSize: 16, color: BLUE, bold: true }); s.addText(t[0], { x: 7.55, y: y - 0.02, w: 5.0, h: 0.32, fontFace: HEAD, fontSize: 12.5, bold: true, color: WHITE }); s.addText(t[1], { x: 7.55, y: y + 0.3, w: 5.0, h: 0.66, fontFace: BODY, fontSize: 10.5, color: T2, valign: "top" }) })
  }

  // ===== 3 TWO WAYS TO USE =====
  {
    const s = P.addSlide(); base(s, 3)
    title(s, "Two ways to use it", "Same verified clients underneath. Pick by audience.")
    const big = (x, icon, h, sub, body, foot) => {
      card(s, x, 1.85, 5.95, 4.6)
      s.addShape(P.shapes.RECTANGLE, { x, y: 1.85, w: 5.95, h: 0.05, fill: { color: GREEN } })
      s.addImage({ data: icon, x: x + 0.35, y: 2.2, w: 0.5, h: 0.5 })
      s.addText(h, { x: x + 1.0, y: 2.2, w: 4.6, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: WHITE, valign: "middle" })
      s.addText(sub, { x: x + 0.35, y: 2.85, w: 5.25, h: 0.4, fontFace: BODY, fontSize: 12, color: GREEN })
      s.addText(body, { x: x + 0.35, y: 3.35, w: 5.3, h: 2.0, fontFace: BODY, fontSize: 12, color: T2, valign: "top", lineSpacingMultiple: 1.15 })
      s.addText(foot, { x: x + 0.35, y: 5.95, w: 5.3, h: 0.4, fontFace: BODY, fontSize: 10.5, italic: true, color: MUTED })
    }
    big(0.6, ic.plug, "As a Medusa plugin", "For the merchant's storefront",
      "Install medusa-payment-kadima in the merchant's Medusa store. Two providers appear at checkout — kadima-card and kadima-ach. Customers pay; Medusa records orders and reconciles via webhook.",
      "The production path. Card data stays out of scope via Hosted Fields.")
    big(6.78, ic.term, "As the ops console", "For your team & testing",
      "Run the branded console (or embed it in the ops dashboard). Mint tokens, run card/ACH transactions, manage the vault, and watch signed webhooks — all against a merchant's account.",
      "Great for onboarding QA, support, and demos. Token held server-side.")
  }

  // ===== 4 WHAT YOU NEED =====
  {
    const s = P.addSlide(); base(s, 4)
    title(s, "Onboarding a merchant — what you need", "Four values from the merchant's Kadima dashboard. That's the whole setup.")
    const items = [[ic.key, "API Access Token", "Bearer token, managed in the merchant's Kadima dashboard. One token covers card + ACH. Held server-side, never in the browser."],
      [ic.term, "Terminal ID", "Identifies the merchant's card MID/TID. Used on every card request (terminal.id). Demo: 404."],
      [ic.id, "DBA ID", "Identifies the merchant for ACH (dba.id) and the Customer Vault. Demo: 466."],
      [ic.hook, "Webhook Secret", "Per-webhook signing key. We verify SHA-512(secret+id+module+action+date) on every event."]]
    items.forEach((it, i) => {
      const x = 0.6 + (i % 2) * 6.18, y = 1.85 + Math.floor(i / 2) * 2.35
      card(s, x, y, 5.98, 2.1)
      s.addImage({ data: it[0], x: x + 0.32, y: y + 0.32, w: 0.5, h: 0.5 })
      s.addText(it[1], { x: x + 1.0, y: y + 0.34, w: 4.7, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, valign: "middle" })
      s.addText(it[2], { x: x + 0.34, y: y + 0.98, w: 5.3, h: 1.0, fontFace: BODY, fontSize: 11.5, color: T2, valign: "top", lineSpacingMultiple: 1.12 })
    })
  }

  // ===== 5 CONFIGURE PLUGIN =====
  {
    const s = P.addSlide(); base(s, 5)
    title(s, "Step 1 — Configure the plugin", "Drop the four values into the Medusa payment module. Both providers register at once.")
    codeBlock(s, 0.6, 1.8, 7.4, 4.7, [
      { t: "// medusa-config.ts", c: MUTED },
      { t: "modules: [{", c: T2 },
      { t: "  resolve: \"@medusajs/medusa/payment\",", c: T2 },
      { t: "  options: { providers: [", c: T2 },
      { t: "    { resolve: \"medusa-payment-kadima/providers/kadima-card\",", c: GREEN },
      { t: "      id: \"kadima-card\", options: {", c: T2 },
      { t: "        apiToken: process.env.KADIMA_TOKEN,", c: T2 },
      { t: "        terminalId: 404,", c: BLUE },
      { t: "        dbaId: 466,            // for saved cards", c: BLUE },
      { t: "        webhookSecret: process.env.KADIMA_WEBHOOK,", c: T2 },
      { t: "        captureMethod: \"auth\", // or \"sale\"", c: T2 },
      { t: "        storeUrl: process.env.KADIMA_STORE_URL,", c: BLUE },
      { t: "        sandbox: true } },", c: T2 },
      { t: "    { resolve: \"medusa-payment-kadima/providers/kadima-ach\",", c: GREEN },
      { t: "      id: \"kadima-ach\", options: {", c: T2 },
      { t: "        apiToken: process.env.KADIMA_TOKEN,", c: T2 },
      { t: "        dbaId: 466, secCode: \"PPD\",", c: BLUE },
      { t: "        webhookSecret: process.env.KADIMA_WEBHOOK } },", c: T2 },
      { t: "  ] }", c: T2 },
      { t: "}]", c: T2 },
    ])
    card(s, 8.25, 1.8, 4.48, 4.7)
    s.addImage({ data: ic.gear, x: 8.55, y: 2.1, w: 0.44, h: 0.44 })
    s.addText("Notes", { x: 9.1, y: 2.12, w: 3.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, valign: "middle" })
    const notes = ["One token, two providers — card uses terminalId, ACH uses dbaId.", "captureMethod: \"auth\" holds funds and captures on fulfillment; \"sale\" captures immediately.", "Set sandbox: false and the token to go live — no code changes.", "dbaId on the card provider is only needed for saved cards (Vault)."]
    notes.forEach((n, i) => { s.addImage({ data: ic.check, x: 8.55, y: 2.78 + i * 0.92, w: 0.2, h: 0.2 }); s.addText(n, { x: 8.85, y: 2.72 + i * 0.92, w: 3.7, h: 0.85, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.1 }) })
  }

  // ===== 6 REGISTER WEBHOOK =====
  {
    const s = P.addSlide(); base(s, 6)
    title(s, "Step 2 — Register the webhook", "Point the merchant's Kadima webhook at your endpoint so settlements, refunds and ACH returns reconcile automatically.")
    steps(s, 0.6, 1.95, 6.0, [
      ["In the Kadima dashboard", "Add a Webhook URL pointing to your deployment: https://your-app.com/api/webhooks/kadima"],
      ["Copy the webhook secret", "Each webhook URL has its own signing secret — paste it into the plugin's webhookSecret."],
      ["Events flow in, signed", "transaction/create, transaction/refund, ach/updateStatus, chargeback/* — each carries Webhook-Signature."],
      ["We verify, then act", "SHA-512 is recomputed and compared before Medusa authorizes/captures/fails the payment."],
    ])
    card(s, 6.95, 1.95, 5.78, 4.2)
    s.addText("Event → what happens", { x: 7.25, y: 2.2, w: 5.2, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
    const map = [["transaction/create", "authorize / capture the session"], ["transaction/refund", "record the refund"], ["ach/updateStatus · Settled", "capture the ACH payment"], ["ach/updateStatus · Returned", "fail + reverse"], ["chargeback/create", "flag for review"]]
    map.forEach((m, i) => { const y = 2.75 + i * 0.62; s.addImage({ data: ic.bell, x: 7.25, y: y + 0.04, w: 0.22, h: 0.22 }); s.addText(m[0], { x: 7.6, y, w: 2.95, h: 0.45, fontFace: MONO, fontSize: 10, color: BLUE, valign: "middle" }); s.addText("→ " + m[1], { x: 10.5, y, w: 2.1, h: 0.45, fontFace: BODY, fontSize: 9.5, color: T2, valign: "middle" }) })
  }

  // ===== 7 USING IT — OVERVIEW (screenshot) =====
  {
    const s = P.addSlide(); base(s, 7)
    title(s, "Using it — the console", "Once configured, everything is one click. The console is connected to the live merchant account.")
    await screenshot(s, "01-overview.png", 0.6, 1.7, 12.13, 5.1)
  }

  // ===== 8 TAKE A CARD PAYMENT (HF) =====
  {
    const s = P.addSlide(); base(s, 8)
    title(s, "Take a card payment — Hosted Fields", "The PCI-safe path for new cards. Card data never touches your servers.")
    steps(s, 0.6, 1.9, 4.7, [
      ["Open Hosted Fields", "Set the amount and an externalId (your order/session id)."],
      ["Mint a token", "Click Mint — the backend returns a single-use Hosted Fields token."],
      ["Customer enters the card", "Kadima's secure iframe fields render. The PAN goes straight to Kadima."],
      ["Reconcile by webhook", "On submit, the transaction/create webhook posts back with your externalId."],
    ])
    await screenshot(s, "02-hosted-fields.png", 5.5, 1.7, 7.23, 5.0)
  }

  // ===== 9 SERVER-TO-SERVER CARD =====
  {
    const s = P.addSlide(); base(s, 9)
    title(s, "Server-to-server card — auth, capture, refund", "For stored tokens, recurring and MOTO. Live response shown — id 217983, authCode TAS246.")
    steps(s, 0.6, 1.9, 4.7, [
      ["Authorize", "Holds funds. Returns a transaction id + auth code (status Approved)."],
      ["Capture", "Settles the authorization — at fulfillment, full or partial."],
      ["Refund / void", "Full or partial; an unsettled charge auto-reverses with an auth code."],
      ["Or tokenize / $0-verify", "Vault a card for reuse, or validate a card with a zero-dollar check."],
    ])
    await screenshot(s, "03-card-auth.png", 5.5, 1.7, 7.23, 5.0)
  }

  // ===== 10 ACH =====
  {
    const s = P.addSlide(); base(s, 10)
    title(s, "Take an ACH payment", "Bank debit created live — id 90785217, status PENDING. Settlement/return arrive via webhook.")
    steps(s, 0.6, 1.9, 4.7, [
      ["Enter bank details", "Account name, number, routing (ABA), type + SEC code (PPD/CCD/WEB/TEL)."],
      ["Create the debit", "Item is created PENDING — treated as authorized in Medusa."],
      ["Settles asynchronously", "ach/updateStatus · Settled → captured; Returned → failed + reverse."],
      ["Refund = void or credit", "Void before submission; an offsetting credit after settlement (PPD/CCD)."],
    ])
    await screenshot(s, "05-ach-debit.png", 5.5, 1.7, 7.23, 5.0)
  }

  // ===== 11 VAULT =====
  {
    const s = P.addSlide(); base(s, 11)
    title(s, "Save a card for repeat & recurring billing", "Chained vault flow run live — customer 8247 → billing → tokenized card.")
    steps(s, 0.6, 1.9, 4.7, [
      ["Create the customer", "Stored in the Customer Vault under the merchant's DBA."],
      ["Add a billing record", "Required before a card can be attached."],
      ["Add the card", "Returns a reusable card.token (no PAN stored by you)."],
      ["Charge on file", "Use the token for one-click repeat or recurring (MIT) sales."],
    ])
    await screenshot(s, "06-vault.png", 5.5, 1.7, 7.23, 5.0)
  }

  // ===== 12 WEBHOOKS =====
  {
    const s = P.addSlide(); base(s, 12)
    title(s, "Watch events come in — verified", "Every event's signature is checked before it's accepted. Invalid signatures are rejected.")
    await screenshot(s, "07-webhooks.png", 0.6, 1.7, 8.0, 5.1)
    card(s, 8.85, 1.85, 3.88, 4.5)
    s.addImage({ data: ic.bell, x: 9.15, y: 2.15, w: 0.42, h: 0.42 })
    s.addText("What you get", { x: 9.65, y: 2.17, w: 2.9, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE, valign: "middle" })
    const pts = ["Each row shows the module, action and whether the signature was valid.", "Invalid-signature events are flagged and never acted on.", "Point Kadima at /api/webhooks/kadima and events appear here in real time."]
    pts.forEach((p, i) => { s.addImage({ data: ic.check, x: 9.15, y: 2.85 + i * 1.05, w: 0.22, h: 0.22 }); s.addText(p, { x: 9.5, y: 2.79 + i * 1.05, w: 3.05, h: 1.0, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.12 }) })
  }

  // ===== 13 GO-LIVE CHECKLIST =====
  {
    const s = P.addSlide(); base(s)
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    s.addShape(P.shapes.OVAL, { x: 8.8, y: 3.0, w: 7, h: 7, fill: { color: "10303F" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.9, h: 0.42, w: 1.85 })
    s.addText("Go-live checklist", { x: 0.85, y: 2.0, w: 11, h: 0.8, fontFace: HEAD, fontSize: 38, bold: true, color: WHITE })
    s.addImage({ data: GRAD, x: 0.88, y: 2.9, w: 3.2, h: 0.045 })
    const cl = ["Merchant provides token + terminal.id + dba.id + webhook secret", "Install the plugin & configure both providers (Step 1)", "Register the webhook URL in Kadima (Step 2)", "Test on sandbox in the console, then set sandbox: false", "Embed the console (or its endpoints) in the ops dashboard"]
    cl.forEach((c, i) => { s.addImage({ data: ic.check, x: 0.9, y: 3.35 + i * 0.6, w: 0.3, h: 0.3 }); s.addText(c, { x: 1.35, y: 3.3 + i * 0.6, w: 10.5, h: 0.5, fontFace: BODY, fontSize: 14, color: T2, valign: "middle" }) })
    s.addText("Card & ACH, straight through Kadima — no middle gateway.", { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: GREEN })
  }

  await P.writeFile({ fileName: path.join(DIR, "Kadima-Medusa-Onboarding-Guide.pptx") })
  console.log("onboarding deck written")
})().catch((e) => { console.error(e); process.exit(1) })
