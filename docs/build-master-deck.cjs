/* Kadima ↔ Medusa — MASTER deck: capabilities + onboarding & usage (with screenshots). */
const pptx = require("pptxgenjs")
const sharp = require("sharp")
const React = require("react")
const RDS = require("react-dom/server")
const FA = require("react-icons/fa")
const path = require("path")

const DIR = __dirname
const LOGO = path.join(DIR, "..", "ui", "assets", "logo-white.png")
const SHOT = (n) => path.join(DIR, "shots", n)

const BG = "0B0B0B", PANEL = "15171C", CARD = "171A1F", BORDER = "2A2E35", CODEBG = "0B0D11"
const GREEN = "31BE72", BLUE = "27A9E2", WHITE = "FFFFFF", T2 = "CFD6DD", MUTED = "8A93A0"
const HEAD = "Manrope", BODY = "Manrope", MONO = "Consolas"
const W = 13.33, H = 7.5
const shadow = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 135, opacity: 0.45 })

async function iconPng(C, color = "#31BE72", size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(C, { color, size: String(size) }))
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64")
}
async function gradientPng(w = 1400, h = 60) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#31BE72"/><stop offset="1" stop-color="#27A9E2"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64")
}
const aspect = async (p) => { const m = await sharp(p).metadata(); return m.width / m.height }

;(async () => {
  const P = new pptx()
  P.defineLayout({ name: "W", width: W, height: H }); P.layout = "W"
  P.author = "Kadima Payments"; P.title = "Kadima ↔ Medusa — Direct Integration (Master)"
  const GRAD = await gradientPng()
  const ic = {
    card: await iconPng(FA.FaRegCreditCard), bank: await iconPng(FA.FaUniversity), lock: await iconPng(FA.FaLock),
    bolt: await iconPng(FA.FaBolt), check: await iconPng(FA.FaCheckCircle), sync: await iconPng(FA.FaSyncAlt),
    swap: await iconPng(FA.FaExchangeAlt), star: await iconPng(FA.FaStar), refresh: await iconPng(FA.FaRedo),
    vault: await iconPng(FA.FaShieldAlt), bell: await iconPng(FA.FaBell), key: await iconPng(FA.FaKey),
    plug: await iconPng(FA.FaPlug), gear: await iconPng(FA.FaCog), id: await iconPng(FA.FaIdBadge),
    term: await iconPng(FA.FaDesktop), hook: await iconPng(FA.FaLink),
  }

  let _p = 1
  const pg = () => ++_p
  const base = (s, n) => {
    s.background = { color: BG }
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    if (n) {
      s.addImage({ path: LOGO, x: 0.55, y: 7.02, h: 0.2, w: 0.88 })
      s.addText(String(n).padStart(2, "0"), { x: W - 1.0, y: 6.94, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, align: "right" })
    }
  }
  const title = (s, t, sub) => {
    s.addText(t, { x: 0.6, y: 0.44, w: W - 1.2, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: WHITE })
    if (sub) s.addText(sub, { x: 0.62, y: 1.04, w: W - 1.4, h: 0.4, fontFace: BODY, fontSize: 13, color: MUTED })
  }
  const card = (s, x, y, w, h, fill) => s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill || CARD }, line: { color: BORDER, width: 1 }, shadow: shadow() })
  const tile = (s, x, y, w, h, icon, head, body, tag, tagColor) => {
    card(s, x, y, w, h)
    s.addShape(P.shapes.RECTANGLE, { x, y, w, h: 0.045, fill: { color: GREEN } })
    s.addImage({ data: icon, x: x + 0.28, y: y + 0.28, w: 0.42, h: 0.42 })
    s.addText(head, { x: x + 0.28, y: y + 0.82, w: w - 0.56, h: 0.34, fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE })
    s.addText(body, { x: x + 0.28, y: y + 1.18, w: w - 0.56, h: h - 1.5, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.05 })
    if (tag) {
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: x + 0.28, y: y + h - 0.5, w: 1.25, h: 0.28, rectRadius: 0.06, fill: { color: tagColor === BLUE ? "0E2A38" : "0E2B1C" } })
      s.addText(tag, { x: x + 0.28, y: y + h - 0.5, w: 1.25, h: 0.28, fontFace: BODY, fontSize: 8.5, bold: true, color: tagColor || GREEN, align: "center", valign: "middle", charSpacing: 1 })
    }
  }
  const screenshot = async (s, file, x, y, boxW, boxH) => {
    const a = await aspect(SHOT(file)); let w = boxW, h = w / a
    if (h > boxH) { h = boxH; w = h * a }
    const ix = x + (boxW - w) / 2, iy = y + (boxH - h) / 2
    s.addShape(P.shapes.RECTANGLE, { x: ix - 0.06, y: iy - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: "000000" }, line: { color: BORDER, width: 1 }, shadow: shadow() })
    s.addImage({ path: SHOT(file), x: ix, y: iy, w, h })
  }
  const steps = (s, x, y, w, items) => {
    items.forEach((it, i) => {
      const sy = y + i * 1.02
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

  // ===== TITLE =====
  {
    const s = P.addSlide(); base(s)
    s.addShape(P.shapes.OVAL, { x: 10.9, y: -3.2, w: 6.4, h: 6.4, fill: { color: "10303F" } })
    s.addShape(P.shapes.OVAL, { x: -2.4, y: 4.6, w: 6.4, h: 6.4, fill: { color: "0E2B1C" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.85, h: 0.5, w: 2.2 })
    s.addText("CAPABILITIES · ONBOARDING · USAGE", { x: 0.9, y: 2.15, w: 9, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 3 })
    s.addText([{ text: "Direct integration\nwith ", options: { color: WHITE } }, { text: "Medusa.js", options: { color: GREEN } }],
      { x: 0.85, y: 2.6, w: 9.0, h: 1.85, fontFace: HEAD, fontSize: 46, bold: true, lineSpacingMultiple: 1.0 })
    s.addText("Card & ACH straight through Kadima — no middle gateway.", { x: 0.88, y: 4.62, w: 11, h: 0.5, fontFace: BODY, fontSize: 18, color: T2 })
    s.addImage({ data: GRAD, x: 0.9, y: 5.3, w: 3.4, h: 0.045 })
    s.addText("Master deck  ·  Sandbox-verified  ·  Demo Merchant (terminal 404 · dba 466)", { x: 0.9, y: 5.55, w: 11, h: 0.4, fontFace: BODY, fontSize: 12.5, color: MUTED })
  }

  // ===== PART 1 divider-ish: WHY =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "One less hop, one less markup", "Today a merchant's payments pass through a middle gateway. This integration removes it.")
    const flow = (x, y, items, color) => items.forEach((t, i) => {
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + i * 0.82, w: 4.0, h: 0.6, rectRadius: 0.08, fill: { color: PANEL }, line: { color: i === items.length - 1 ? color : BORDER, width: i === items.length - 1 ? 1.5 : 1 } })
      s.addText(t, { x: x + 0.2, y: y + i * 0.82, w: 3.7, h: 0.6, fontFace: BODY, fontSize: 13, bold: i === items.length - 1, color: i === items.length - 1 ? WHITE : T2, valign: "middle" })
      if (i < items.length - 1) s.addText("↓", { x: x + 1.85, y: y + i * 0.82 + 0.58, w: 0.3, h: 0.26, fontSize: 12, color: MUTED, align: "center" })
    })
    card(s, 0.6, 1.9, 5.75, 3.9)
    s.addText("TODAY", { x: 0.9, y: 2.15, w: 4, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: MUTED, charSpacing: 2 })
    flow(1.45, 2.6, ["Merchant store", "Middle gateway (NMI)", "Kadima"], "6B7280")
    s.addText("Extra fees · extra failure point · extra integration", { x: 0.9, y: 5.35, w: 5.2, h: 0.35, fontFace: BODY, fontSize: 10.5, italic: true, color: MUTED })
    card(s, 6.95, 1.9, 5.75, 3.9)
    s.addShape(P.shapes.RECTANGLE, { x: 6.95, y: 1.9, w: 5.75, h: 0.05, fill: { color: GREEN } })
    s.addText("WITH THIS INTEGRATION", { x: 7.25, y: 2.15, w: 5, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 2 })
    flow(8.45, 3.05, ["Merchant store", "Kadima"], GREEN)
    s.addText("Direct API + webhooks · lower cost · fewer moving parts", { x: 7.25, y: 5.35, w: 5.2, h: 0.35, fontFace: BODY, fontSize: 10.5, italic: true, color: T2 })
  }

  // ===== ARCHITECTURE =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Two providers, one plugin", "Card is synchronous; ACH is asynchronous — each its own Medusa provider over a shared, verified client.")
    tile(s, 0.6, 1.95, 3.86, 3.5, ic.card, "kadima-card", "Synchronous. Merchant = terminal.id. Hosted Fields for new cards (SAQ-A); server-to-server for stored tokens. Configurable capture: auth→capture or one-shot sale.", "SYNC", GREEN)
    tile(s, 4.73, 1.95, 3.86, 3.5, ic.bank, "kadima-ach", "Asynchronous. Merchant = dba.id. Submit returns authorized; the Settled webhook drives captured, Returned drives failed. SEC: PPD/CCD/WEB/TEL.", "ASYNC", BLUE)
    tile(s, 8.86, 1.95, 3.86, 3.5, ic.lock, "Shared & secure", "Per-merchant Bearer token, server-side. SHA-512 webhook verification. Reference-verified shapes. PCI SAQ-A — card data never hits your backend.", "SECURE", GREEN)
    s.addText("Reference-verified claim-by-claim, then proven live on the Kadima sandbox.", { x: 0.62, y: 5.75, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: MUTED })
  }

  // ===== CAPABILITY MATRIX =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "What's available", "Live = executed on sandbox.  Available = documented & supported, ready to wire.")
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
    data.forEach((r, i) => [0, 1].forEach((c) => {
      const cx = x + c * colW, label = r[c * 2], state = r[c * 2 + 1], live = state === "Live" || state === "Verified"
      s.addShape(P.shapes.RECTANGLE, { x: cx, y: y + i * rh, w: colW - 0.12, h: rh - 0.08, fill: { color: CARD }, line: { color: BORDER, width: 0.5 } })
      s.addImage({ data: live ? ic.check : ic.star, x: cx + 0.2, y: y + i * rh + 0.16, w: 0.24, h: 0.24 })
      s.addText(label, { x: cx + 0.55, y: y + i * rh, w: colW - 2.1, h: rh - 0.08, fontFace: BODY, fontSize: 11.5, color: WHITE, valign: "middle" })
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: cx + colW - 1.45, y: y + i * rh + 0.12, w: 1.15, h: 0.3, rectRadius: 0.06, fill: { color: live ? "0E2B1C" : "26221A" } })
      s.addText(state, { x: cx + colW - 1.45, y: y + i * rh + 0.12, w: 1.15, h: 0.3, fontFace: BODY, fontSize: 9, bold: true, color: live ? GREEN : "E0A93B", align: "center", valign: "middle", charSpacing: 1 })
    }))
  }

  // ===== PROOF =====
  {
    const s = P.addSlide(); base(s, pg())
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
    const fixes = ["ACH SEC field is SECCode (not secCode); bank fields are top-level, not nested", "Card-vault customer id is identificator; ACH customer id is identifier", "Hosted Fields token uses a flat terminal, not nested terminal.id", "Adding a vault card requires creating a billing record first"]
    fixes.forEach((f, i) => { s.addImage({ data: ic.check, x: 0.95, y: 4.72 + i * 0.42, w: 0.22, h: 0.22 }); s.addText(f, { x: 1.3, y: 4.66 + i * 0.42, w: 11.2, h: 0.4, fontFace: BODY, fontSize: 11.5, color: T2, valign: "middle" }) })
  }

  // ===== PART 2: ONBOARDING — where it stands =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Where the integration stands", "The core is built and proven live. What remains is wiring it into a running store and shipping it.")
    card(s, 0.6, 1.7, 6.0, 4.85)
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 1.7, w: 6.0, h: 0.05, fill: { color: GREEN } })
    s.addText("✓  DONE — built & live-tested", { x: 0.9, y: 1.95, w: 5.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: GREEN })
    const done = ["Card client + Hosted Fields (SAQ-A)", "Auth · sale · capture · refund · tokenize · $0 verify", "ACH debit/credit + void/verify, SEC codes", "Customer Vault: customer → billing → saved card", "Webhook signature verify (SHA-512) + 7 unit tests", "Both Medusa providers + ops-dashboard page", "12/13 live sandbox ops green"]
    done.forEach((d, i) => { s.addImage({ data: ic.check, x: 0.95, y: 2.5 + i * 0.55, w: 0.22, h: 0.22 }); s.addText(d, { x: 1.3, y: 2.44 + i * 0.55, w: 5.1, h: 0.45, fontFace: BODY, fontSize: 11.5, color: T2, valign: "middle" }) })
    card(s, 6.95, 1.7, 5.78, 4.85)
    s.addShape(P.shapes.RECTANGLE, { x: 6.95, y: 1.7, w: 5.78, h: 0.05, fill: { color: BLUE } })
    s.addText("◯  REMAINING — to go production", { x: 7.25, y: 1.95, w: 5.2, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: BLUE })
    const todo = [["Run inside a Medusa store", "Install the plugin and compile the providers against @medusajs/framework."], ["Switch to production", "Swap sandbox hosts + the live per-merchant token (KADIMA_GATEWAY_SANDBOX=false)."], ["Register the webhook URL", "Point Kadima's webhook at /api/webhooks/kadima-gateway."], ["Per-merchant config", "Move terminal/dba/token to per-merchant records in the ops panel."]]
    todo.forEach((t, i) => { const y = 2.5 + i * 1.0; s.addText("•", { x: 7.28, y, w: 0.3, h: 0.3, fontSize: 16, color: BLUE, bold: true }); s.addText(t[0], { x: 7.55, y: y - 0.02, w: 5.0, h: 0.32, fontFace: HEAD, fontSize: 12.5, bold: true, color: WHITE }); s.addText(t[1], { x: 7.55, y: y + 0.3, w: 5.0, h: 0.66, fontFace: BODY, fontSize: 10.5, color: T2, valign: "top" }) })
  }

  // ===== TWO WAYS =====
  {
    const s = P.addSlide(); base(s, pg())
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
    big(0.6, ic.plug, "As a Medusa plugin", "For the merchant's storefront", "Install medusa-payment-kadima in the merchant's Medusa store. Two providers appear at checkout — kadima-card and kadima-ach. Customers pay; Medusa records orders and reconciles via webhook.", "The production path. Card data stays out of scope via Hosted Fields.")
    big(6.78, ic.term, "In the ops dashboard", "For your team & testing", "The Payments Gateway page is now built into the ops panel (api/ops/gateway + /ops/gateway). Mint tokens, run card/ACH transactions, manage the vault — token held server-side.", "Great for onboarding QA, support, and demos.")
  }

  // ===== WHAT YOU NEED =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Onboarding a merchant — what you need", "Four values from the merchant's Kadima dashboard. That's the whole setup.")
    const items = [[ic.key, "API Access Token", "Bearer token from the merchant's Kadima dashboard. One token covers card + ACH + vault. Held server-side, never in the browser."],
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

  // ===== STEP 1 CONFIGURE =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 1 — Configure", "In a Medusa store: the payment module. In the ops panel: set the gateway env vars.")
    codeBlock(s, 0.6, 1.8, 7.4, 4.7, [
      { t: "// ops panel — .env", c: MUTED },
      { t: "KADIMA_GATEWAY_TOKEN=<merchant token>", c: GREEN },
      { t: "KADIMA_GATEWAY_TERMINAL_ID=404", c: BLUE },
      { t: "KADIMA_GATEWAY_DBA_ID=466", c: BLUE },
      { t: "KADIMA_GATEWAY_SANDBOX=true", c: T2 },
      { t: "KADIMA_GATEWAY_WEBHOOK_SECRET=<secret>", c: T2 },
      { t: "", c: T2 },
      { t: "// Medusa store — medusa-config.ts", c: MUTED },
      { t: "providers: [", c: T2 },
      { t: "  { resolve: \"medusa-payment-kadima/providers/kadima-card\",", c: GREEN },
      { t: "    options: { apiToken, terminalId: 404, dbaId: 466,", c: T2 },
      { t: "      webhookSecret, captureMethod: \"auth\" } },", c: T2 },
      { t: "  { resolve: \"medusa-payment-kadima/providers/kadima-ach\",", c: GREEN },
      { t: "    options: { apiToken, dbaId: 466, secCode: \"PPD\" } },", c: T2 },
      { t: "]", c: T2 },
    ])
    card(s, 8.25, 1.8, 4.48, 4.7)
    s.addImage({ data: ic.gear, x: 8.55, y: 2.1, w: 0.44, h: 0.44 })
    s.addText("Notes", { x: 9.1, y: 2.12, w: 3.4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, valign: "middle" })
    const notes = ["One token, two providers — card uses terminalId, ACH uses dbaId.", "captureMethod \"auth\" captures on fulfillment; \"sale\" captures immediately.", "Set sandbox false + live token to go production — no code changes.", "Gateway endpoints are gated to manager+ in the ops panel."]
    notes.forEach((n, i) => { s.addImage({ data: ic.check, x: 8.55, y: 2.78 + i * 0.92, w: 0.2, h: 0.2 }); s.addText(n, { x: 8.85, y: 2.72 + i * 0.92, w: 3.7, h: 0.85, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.1 }) })
  }

  // ===== STEP 2 WEBHOOK =====
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 2 — Register the webhook", "Point the merchant's Kadima webhook at your endpoint so settlements, refunds and ACH returns reconcile automatically.")
    steps(s, 0.6, 1.95, 6.0, [
      ["In the Kadima dashboard", "Add a Webhook URL: https://your-app.com/api/webhooks/kadima-gateway"],
      ["Copy the webhook secret", "Each webhook URL has its own signing secret — set KADIMA_GATEWAY_WEBHOOK_SECRET."],
      ["Events flow in, signed", "transaction/create, transaction/refund, ach/updateStatus, chargeback/* — each carries Webhook-Signature."],
      ["We verify, then act", "SHA-512 recomputed and compared before Medusa authorizes/captures/fails the payment."],
    ])
    card(s, 6.95, 1.95, 5.78, 4.2)
    s.addText("Event → what happens", { x: 7.25, y: 2.2, w: 5.2, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
    const map = [["transaction/create", "authorize / capture"], ["transaction/refund", "record the refund"], ["ach/updateStatus · Settled", "capture the ACH payment"], ["ach/updateStatus · Returned", "fail + reverse"], ["chargeback/create", "flag for review"]]
    map.forEach((m, i) => { const y = 2.75 + i * 0.62; s.addImage({ data: ic.bell, x: 7.25, y: y + 0.04, w: 0.22, h: 0.22 }); s.addText(m[0], { x: 7.6, y, w: 2.95, h: 0.45, fontFace: MONO, fontSize: 10, color: BLUE, valign: "middle" }); s.addText("→ " + m[1], { x: 10.5, y, w: 2.1, h: 0.45, fontFace: BODY, fontSize: 9.5, color: T2, valign: "middle" }) })
  }

  // ===== SCREENSHOT WALKTHROUGH =====
  const shotSlide = async (t, sub, steps_, file) => {
    const s = P.addSlide(); base(s, pg())
    title(s, t, sub)
    steps(s, 0.6, 1.9, 4.7, steps_)
    await screenshot(s, file, 5.5, 1.7, 7.23, 5.0)
  }
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Using it — the ops console", "Once configured, everything is one click. The Payments Gateway page lives in the ops panel.")
    await screenshot(s, "01-overview.png", 0.6, 1.7, 12.13, 5.1)
  }
  await shotSlide("Take a card payment — Hosted Fields", "PCI-safe path for new cards. Card data never touches your servers.", [
    ["Open Hosted Fields", "Set the amount and an externalId (your order/session id)."],
    ["Mint a token", "The backend returns a single-use Hosted Fields token."],
    ["Customer enters the card", "Kadima's secure iframe fields render. The PAN goes straight to Kadima."],
    ["Reconcile by webhook", "On submit, transaction/create posts back with your externalId."],
  ], "02-hosted-fields.png")
  await shotSlide("Server-to-server card — auth, capture, refund", "Stored tokens, recurring and MOTO. Live: id 217983, authCode TAS246.", [
    ["Authorize", "Holds funds. Returns a transaction id + auth code."],
    ["Capture", "Settles the authorization — full or partial."],
    ["Refund / void", "Unsettled auto-reverses with an auth code."],
    ["Tokenize / $0-verify", "Vault a card, or validate with a zero-dollar check."],
  ], "03-card-auth.png")
  await shotSlide("Take an ACH payment", "Bank debit created live — id 90785217, status PENDING. Settlement/return via webhook.", [
    ["Enter bank details", "Account name, number, routing (ABA), type + SEC code."],
    ["Create the debit", "Item created PENDING — treated as authorized in Medusa."],
    ["Settles asynchronously", "Settled → captured; Returned → failed + reverse."],
    ["Refund = void or credit", "Void before submission; offsetting credit after settle."],
  ], "05-ach-debit.png")
  await shotSlide("Save a card — repeat & recurring", "Chained vault flow run live — customer 8247 → billing → tokenized card.", [
    ["Create the customer", "Stored in the Customer Vault under the merchant's DBA."],
    ["Add a billing record", "Required before a card can be attached."],
    ["Add the card", "Returns a reusable card.token (no PAN stored by you)."],
    ["Charge on file", "Use the token for repeat or recurring (MIT) sales."],
  ], "06-vault.png")
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Watch events come in — verified", "Every event's signature is checked before it's accepted. Invalid signatures are rejected.")
    await screenshot(s, "07-webhooks.png", 0.6, 1.7, 8.0, 5.1)
    card(s, 8.85, 1.85, 3.88, 4.5)
    s.addImage({ data: ic.bell, x: 9.15, y: 2.15, w: 0.42, h: 0.42 })
    s.addText("What you get", { x: 9.65, y: 2.17, w: 2.9, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE, valign: "middle" })
    const pts = ["Each row shows module, action and whether the signature was valid.", "Invalid-signature events are flagged and never acted on.", "Point Kadima at /api/webhooks/kadima-gateway and events appear in real time."]
    pts.forEach((p, i) => { s.addImage({ data: ic.check, x: 9.15, y: 2.85 + i * 1.05, w: 0.22, h: 0.22 }); s.addText(p, { x: 9.5, y: 2.79 + i * 1.05, w: 3.05, h: 1.0, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.12 }) })
  }

  // ===== CLOSE =====
  {
    const s = P.addSlide(); base(s)
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    s.addShape(P.shapes.OVAL, { x: 8.8, y: 3.0, w: 7, h: 7, fill: { color: "10303F" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.9, h: 0.42, w: 1.85 })
    s.addText("Go-live checklist", { x: 0.85, y: 2.0, w: 11, h: 0.8, fontFace: HEAD, fontSize: 38, bold: true, color: WHITE })
    s.addImage({ data: GRAD, x: 0.88, y: 2.9, w: 3.2, h: 0.045 })
    const cl = ["Merchant provides token + terminal.id + dba.id + webhook secret", "Configure the plugin / ops env (Step 1)", "Register the webhook URL in Kadima (Step 2)", "Test on sandbox in the ops Gateway page, then set sandbox false", "Move credentials to per-merchant records for multi-merchant use"]
    cl.forEach((c, i) => { s.addImage({ data: ic.check, x: 0.9, y: 3.35 + i * 0.6, w: 0.3, h: 0.3 }); s.addText(c, { x: 1.35, y: 3.3 + i * 0.6, w: 10.5, h: 0.5, fontFace: BODY, fontSize: 14, color: T2, valign: "middle" }) })
    s.addText("Card & ACH, straight through Kadima — no middle gateway.", { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: GREEN })
  }

  await P.writeFile({ fileName: path.join(DIR, "Kadima-Medusa-Integration-MASTER.pptx") })
  console.log("master deck written — " + _p + " slides")
})().catch((e) => { console.error(e); process.exit(1) })
