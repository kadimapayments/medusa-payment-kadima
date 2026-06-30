/* Kadima × Medusa — merchant-facing INSTALL guide deck. */
const pptx = require("pptxgenjs")
const sharp = require("sharp")
const React = require("react")
const RDS = require("react-dom/server")
const FA = require("react-icons/fa")
const path = require("path")

const DIR = __dirname
const LOGO = path.join(DIR, "..", "ui", "assets", "logo-white.png")
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

;(async () => {
  const P = new pptx()
  P.defineLayout({ name: "W", width: W, height: H }); P.layout = "W"
  P.author = "Kadima Payments"; P.title = "Kadima × Medusa — Install Guide"
  const GRAD = await gradientPng()
  const ic = {
    dl: await iconPng(FA.FaDownload), gear: await iconPng(FA.FaCog), plug: await iconPng(FA.FaPlug),
    bolt: await iconPng(FA.FaBolt), bank: await iconPng(FA.FaUniversity), card: await iconPng(FA.FaRegCreditCard),
    lock: await iconPng(FA.FaLock), bell: await iconPng(FA.FaBell), check: await iconPng(FA.FaCheckCircle),
    book: await iconPng(FA.FaBook), rocket: await iconPng(FA.FaRocket), key: await iconPng(FA.FaKey),
    store: await iconPng(FA.FaStore), sync: await iconPng(FA.FaSyncAlt),
  }
  let _p = 1; const pg = () => ++_p
  const base = (s, n) => {
    s.background = { color: BG }
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    if (n) { s.addImage({ path: LOGO, x: 0.55, y: 7.02, h: 0.2, w: 0.88 }); s.addText(String(n).padStart(2, "0"), { x: W - 1.0, y: 6.94, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, align: "right" }) }
  }
  const title = (s, t, sub) => {
    s.addText(t, { x: 0.6, y: 0.44, w: W - 1.2, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: WHITE })
    if (sub) s.addText(sub, { x: 0.62, y: 1.04, w: W - 1.4, h: 0.4, fontFace: BODY, fontSize: 13, color: MUTED })
  }
  const card = (s, x, y, w, h, fill) => s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill || CARD }, line: { color: BORDER, width: 1 }, shadow: shadow() })
  const tile = (s, x, y, w, h, icon, head, body) => {
    card(s, x, y, w, h); s.addShape(P.shapes.RECTANGLE, { x, y, w, h: 0.045, fill: { color: GREEN } })
    s.addImage({ data: icon, x: x + 0.28, y: y + 0.28, w: 0.42, h: 0.42 })
    s.addText(head, { x: x + 0.28, y: y + 0.82, w: w - 0.56, h: 0.34, fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE })
    s.addText(body, { x: x + 0.28, y: y + 1.18, w: w - 0.56, h: h - 1.4, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.05 })
  }
  const codeBlock = (s, x, y, w, h, lines, fs = 11) => {
    s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: CODEBG }, line: { color: BORDER, width: 1 } })
    s.addText(lines.map((l, i) => ({ text: l.t, options: { color: l.c || T2, breakLine: i < lines.length - 1, bold: l.b } })),
      { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: h - 0.36, fontFace: MONO, fontSize: fs, valign: "top", lineSpacingMultiple: 1.14 })
  }
  const stepBadge = (s, x, y, n) => { s.addShape(P.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: "0E2B1C" }, line: { color: GREEN, width: 1.5 } }); s.addText(String(n), { x, y, w: 0.5, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: GREEN, align: "center", valign: "middle" }) }

  // 1 TITLE
  {
    const s = P.addSlide(); base(s)
    s.addShape(P.shapes.OVAL, { x: 10.6, y: -3.0, w: 6.4, h: 6.4, fill: { color: "10303F" } })
    s.addShape(P.shapes.OVAL, { x: -2.4, y: 4.6, w: 6.4, h: 6.4, fill: { color: "0E2B1C" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.85, h: 0.5, w: 2.2 })
    s.addText("MEDUSA PLUGIN · INSTALL GUIDE", { x: 0.9, y: 2.25, w: 9, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: GREEN, charSpacing: 3 })
    s.addText([{ text: "Accept payments with ", options: { color: WHITE } }, { text: "Kadima", options: { color: GREEN } }, { text: "\non your Medusa store", options: { color: WHITE } }],
      { x: 0.85, y: 2.7, w: 11.4, h: 1.7, fontFace: HEAD, fontSize: 40, bold: true, lineSpacingMultiple: 1.0 })
    s.addImage({ data: GRAD, x: 0.9, y: 4.75, w: 3.4, h: 0.045 })
    s.addText([{ text: "npm install medusa-payment-kadima", options: { fontFace: MONO, color: BLUE } }, { text: "    ·  card + ACH, no middle gateway", options: { color: MUTED } }],
      { x: 0.9, y: 5.0, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 13 })
  }

  // 2 WHAT YOU GET
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "What you get", "One plugin adds Kadima as a native payment method at checkout — cards and bank payments.")
    tile(s, 0.6, 1.9, 3.86, 2.3, ic.card, "Cards", "Visa/MC/Amex/Discover via Kadima Hosted Fields. Auth, capture, refund, saved cards.")
    tile(s, 4.73, 1.9, 3.86, 2.3, ic.bank, "ACH / eCheck", "Bank debits with SEC codes (PPD/CCD/WEB/TEL). Settlement & returns via webhook.")
    tile(s, 8.86, 1.9, 3.86, 2.3, ic.lock, "PCI SAQ-A", "Card data is entered in Kadima's secure iframe — it never touches your store or server.")
    tile(s, 0.6, 4.35, 3.86, 2.0, ic.bolt, "No middle gateway", "Process directly through Kadima — no NMI or extra gateway fees in between.")
    tile(s, 4.73, 4.35, 3.86, 2.0, ic.sync, "Saved cards & recurring", "Store cards in Kadima's Customer Vault for one-click repeat & subscription billing.")
    tile(s, 8.86, 4.35, 3.86, 2.0, ic.bell, "Webhook reconciliation", "Signed events keep order status in sync automatically (settled, refunded, returned).")
  }

  // 3 PREREQUISITES
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Before you start", "Two things: a Medusa v2 store, and a Kadima merchant account with API credentials.")
    card(s, 0.6, 1.9, 5.95, 4.5)
    s.addImage({ data: ic.store, x: 0.9, y: 2.2, w: 0.5, h: 0.5 })
    s.addText("A Medusa v2 store", { x: 1.55, y: 2.22, w: 4.6, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, valign: "middle" })
    s.addText("Self-hosted Medusa v2 backend + a storefront (e.g. the Next.js starter). New to Medusa? Spin one up with:", { x: 0.9, y: 2.85, w: 5.4, h: 0.9, fontFace: BODY, fontSize: 12, color: T2, valign: "top", lineSpacingMultiple: 1.15 })
    codeBlock(s, 0.9, 3.7, 5.35, 0.6, [{ t: "npx create-medusa-app my-store", c: GREEN }], 11)
    s.addText("Requires Node 20+ and PostgreSQL.", { x: 0.9, y: 4.45, w: 5.4, h: 0.4, fontFace: BODY, fontSize: 11, italic: true, color: MUTED })

    card(s, 6.78, 1.9, 5.95, 4.5)
    s.addImage({ data: ic.key, x: 7.08, y: 2.2, w: 0.5, h: 0.5 })
    s.addText("Kadima credentials", { x: 7.73, y: 2.22, w: 4.6, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, valign: "middle" })
    s.addText("A boarded Kadima merchant account. You'll create the token in Step 1; you'll also use:", { x: 7.08, y: 2.85, w: 5.5, h: 0.6, fontFace: BODY, fontSize: 12, color: T2, valign: "top", lineSpacingMultiple: 1.1 })
    const creds = [["API access token", "created in Step 1 (scoped)"], ["Terminal ID", "your card MID/TID"], ["DBA ID", "for ACH + saved cards"], ["Webhook secret", "to verify signed events"]]
    creds.forEach((c, i) => { const y = 3.55 + i * 0.7; s.addImage({ data: ic.check, x: 7.08, y: y + 0.03, w: 0.24, h: 0.24 }); s.addText([{ text: c[0] + "  ", options: { bold: true, color: WHITE } }, { text: "— " + c[1], options: { color: MUTED } }], { x: 7.42, y, w: 5.1, h: 0.5, fontFace: BODY, fontSize: 12, valign: "middle" }) })
  }

  // 4 STEP 1 — GET API CREDENTIALS
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 1 — Get your Kadima API credentials", "Create a scoped API token in your Kadima dashboard — it authenticates every card & ACH call.")
    stepBadge(s, 0.6, 1.95, 1)
    s.addText("In the dashboard side menu (Help Center category), open Developers → Tokens.", { x: 1.4, y: 1.98, w: 11.3, h: 0.5, fontFace: BODY, fontSize: 13, color: T2, valign: "middle" })

    // Left — create the token
    card(s, 0.6, 2.75, 6.45, 3.65)
    s.addImage({ data: ic.key, x: 0.9, y: 3.02, w: 0.42, h: 0.42 })
    s.addText("Create the token", { x: 1.45, y: 3.04, w: 5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, valign: "middle" })
    const tk = [
      "Click Add token.",
      "Name it (e.g. \"Medusa store\") and pick your merchant.",
      "Click Submit, then add the permissions (right).",
      "Copy the token and store it securely — keep it secret, never commit it to source control.",
    ]
    tk.forEach((t, i) => { const y = 3.6 + i * 0.68; s.addText(String(i + 1), { x: 0.95, y, w: 0.32, h: 0.3, fontFace: HEAD, fontSize: 13, bold: true, color: GREEN, align: "center" }); s.addText(t, { x: 1.38, y: y - 0.05, w: 5.5, h: 0.66, fontFace: BODY, fontSize: 11.5, color: T2, valign: "top", lineSpacingMultiple: 1.08 }) })

    // Right — permissions
    card(s, 7.25, 2.75, 5.48, 3.65)
    s.addImage({ data: ic.lock, x: 7.55, y: 3.02, w: 0.42, h: 0.42 })
    s.addText("Enable these permissions", { x: 8.1, y: 3.04, w: 4.3, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, valign: "middle" })
    const perms = [["Transactions / Payments", "card auth, capture, refund, void"], ["ACH", "bank debits, status, void"], ["Customer Vault", "saved cards & recurring"], ["Webhooks / Events", "signed status events"]]
    perms.forEach((p, i) => { const y = 3.62 + i * 0.56; s.addImage({ data: ic.check, x: 7.55, y: y + 0.02, w: 0.22, h: 0.22 }); s.addText([{ text: p[0] + "  ", options: { bold: true, color: WHITE } }, { text: "— " + p[1], options: { color: MUTED } }], { x: 7.89, y, w: 4.6, h: 0.5, fontFace: BODY, fontSize: 11.5, valign: "middle" }) })
    s.addText([
      { text: "Card payments need the ", options: { color: MUTED } },
      { text: "api-creditcard-payment-read-write", options: { color: BLUE, fontFace: MONO } },
      { text: " scope. Enable all available so ACH, saved cards & webhooks work too.", options: { color: MUTED } },
    ], { x: 7.55, y: 5.78, w: 4.95, h: 0.62, fontFace: BODY, fontSize: 10, valign: "top", lineSpacingMultiple: 1.06 })
  }

  // 5 STEP 2 INSTALL
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 2 — Install the plugin", "One command in your Medusa backend project.")
    stepBadge(s, 0.6, 1.95, 2)
    codeBlock(s, 1.4, 1.95, 11.3, 0.95, [{ t: "npm install medusa-payment-kadima", c: GREEN }], 15)
    s.addText("Published on npm — public package, MIT licensed.", { x: 1.4, y: 3.05, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, color: MUTED })
    card(s, 0.6, 3.7, 12.13, 2.7)
    s.addImage({ data: ic.book, x: 0.9, y: 4.0, w: 0.42, h: 0.42 })
    s.addText("What gets installed", { x: 1.45, y: 4.02, w: 10, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE, valign: "middle" })
    const pts = ["Two payment providers: kadima-card (cards) and kadima-ach (bank).", "Ready-to-use storefront components for the card + ACH forms.", "Hosted Fields, Customer Vault, and signed-webhook handling — built in."]
    pts.forEach((p, i) => { s.addImage({ data: ic.check, x: 0.95, y: 4.6 + i * 0.5, w: 0.22, h: 0.22 }); s.addText(p, { x: 1.3, y: 4.54 + i * 0.5, w: 11.2, h: 0.45, fontFace: BODY, fontSize: 12, color: T2, valign: "middle" }) })
  }

  // 6 STEP 3 CONFIGURE
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 3 — Configure", "Register both providers on the Payment module in medusa-config.ts.")
    codeBlock(s, 0.6, 1.8, 8.0, 4.45, [
      { t: "// medusa-config.ts", c: MUTED },
      { t: "modules: [{", c: T2 },
      { t: "  resolve: \"@medusajs/medusa/payment\",", c: T2 },
      { t: "  options: { providers: [", c: T2 },
      { t: "    { resolve: \"medusa-payment-kadima/providers/kadima-card\",", c: GREEN },
      { t: "      id: \"kadima-card\", options: {", c: T2 },
      { t: "        apiToken: process.env.KADIMA_TOKEN,", c: T2 },
      { t: "        terminalId: Number(process.env.KADIMA_TERMINAL_ID),", c: BLUE },
      { t: "        dbaId: Number(process.env.KADIMA_DBA_ID),", c: BLUE },
      { t: "        webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,", c: T2 },
      { t: "        captureMethod: \"auth\",", c: T2 },
      { t: "        storeUrl: process.env.KADIMA_STORE_URL, // your storefront URL", c: BLUE },
      { t: "        sandbox: true } },", c: T2 },
      { t: "    { resolve: \"medusa-payment-kadima/providers/kadima-ach\",", c: GREEN },
      { t: "      id: \"kadima-ach\", options: {", c: T2 },
      { t: "        apiToken: process.env.KADIMA_TOKEN,", c: T2 },
      { t: "        dbaId: Number(process.env.KADIMA_DBA_ID),", c: BLUE },
      { t: "        secCode: \"WEB\", sandbox: true } },", c: T2 },
      { t: "  ] }", c: T2 }, { t: "}]", c: T2 },
    ], 10.5)
    card(s, 8.85, 1.8, 3.88, 4.45)
    s.addImage({ data: ic.gear, x: 9.15, y: 2.1, w: 0.42, h: 0.42 })
    s.addText("Then", { x: 9.7, y: 2.12, w: 2.8, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, valign: "middle" })
    const notes = ["Put your Kadima values + storeUrl (your storefront URL) in .env.", "storeUrl must match where the storefront runs — Hosted Fields locks to it.", "captureMethod: \"auth\" captures on fulfillment; \"sale\" captures now.", "Set sandbox explicitly — sandbox: true to test, false for live."]
    notes.forEach((n, i) => { s.addImage({ data: ic.check, x: 9.15, y: 2.78 + i * 0.9, w: 0.2, h: 0.2 }); s.addText(n, { x: 9.45, y: 2.72 + i * 0.9, w: 3.1, h: 0.85, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.1 }) })

    // Footgun callout — the #1 cause of a 401 on first deploy.
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 6.4, w: 12.13, h: 0.6, fill: { color: "2A1E0E" }, line: { color: "C98A2B", width: 1 } })
    s.addImage({ data: ic.bolt, x: 0.8, y: 6.55, w: 0.3, h: 0.3 })
    s.addText([
      { text: "Don't derive sandbox from NODE_ENV", options: { bold: true, color: "F0B454" } },
      { text: " — Railway/Render/Vercel set NODE_ENV=production, which sends sandbox creds to the live host (401). The plugin logs its resolved host + sandbox + token on startup — check that first.", options: { color: T2 } },
    ], { x: 1.25, y: 6.44, w: 11.3, h: 0.52, fontFace: BODY, fontSize: 10.5, valign: "middle", lineSpacingMultiple: 1.0 })
  }

  // 7 STEP 4 STOREFRONT
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 4 — Add the checkout components", "Drop the included storefront components into your checkout's payment step.")
    tile(s, 0.6, 1.95, 5.95, 2.6, ic.card, "KadimaHostedFields.tsx", "Renders Kadima's secure card fields for the kadima-card provider. The customer enters the card in Kadima's iframe; on success your cart completes.")
    tile(s, 6.78, 1.95, 5.95, 2.6, ic.bank, "KadimaAchForm.tsx", "Collects bank details for the kadima-ach provider, writes them to the payment session, and places the order (authorized; settles in 1–4 days).")
    s.addText("Copy from the package's storefront/ folder:", { x: 0.62, y: 4.8, w: 11, h: 0.35, fontFace: BODY, fontSize: 12, color: MUTED })
    codeBlock(s, 0.6, 5.15, 12.13, 1.0, [
      { t: "// node_modules/medusa-payment-kadima/storefront/", c: MUTED },
      { t: "KadimaHostedFields.tsx   KadimaAchForm.tsx   README.md  (wiring guide)", c: T2 },
    ], 11)
    s.addText([
      { text: "Pass ", options: { color: MUTED } },
      { text: "amount={cart.total}", options: { color: BLUE, fontFace: MONO } },
      { text: " to KadimaHostedFields — Medusa v2 totals are already in dollars, so don't divide by 100.", options: { color: MUTED } },
    ], { x: 0.62, y: 6.35, w: 12, h: 0.4, fontFace: BODY, fontSize: 10.5, valign: "middle" })
  }

  // 8 STEP 5 WEBHOOK
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 5 — Register the webhook", "So settlements, refunds and ACH returns reconcile order status automatically.")
    stepBadge(s, 0.6, 1.95, 5)
    s.addText("In your Kadima dashboard, add a Webhook URL pointing to your Medusa app:", { x: 1.4, y: 1.98, w: 11, h: 0.5, fontFace: BODY, fontSize: 13, color: T2, valign: "middle" })
    codeBlock(s, 1.4, 2.6, 11.3, 1.2, [
      { t: "https://<your-store>/hooks/payment/kadima-card", c: GREEN },
      { t: "https://<your-store>/hooks/payment/kadima-ach", c: GREEN },
    ], 12)
    card(s, 0.6, 4.1, 12.13, 2.3)
    s.addText("Event → what happens", { x: 0.9, y: 4.35, w: 11, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
    const map = [["transaction/create", "payment authorized / captured"], ["transaction/refund", "refund recorded"], ["ach/updateStatus → Settled", "ACH captured"], ["ach/updateStatus → Returned", "order flagged / reversed"]]
    map.forEach((m, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 0.95 + col * 6.0, y = 4.9 + row * 0.62; s.addImage({ data: ic.bell, x, y: y + 0.03, w: 0.22, h: 0.22 }); s.addText([{ text: m[0] + "  ", options: { fontFace: MONO, color: BLUE } }, { text: "→ " + m[1], options: { color: T2 } }], { x: x + 0.32, y, w: 5.4, h: 0.4, fontFace: BODY, fontSize: 11, valign: "middle" }) })
  }

  // 9 STEP 6 GO LIVE
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "Step 6 — Test, then go live", "Verify on sandbox, then flip to production.")
    card(s, 0.6, 1.95, 5.95, 4.3)
    s.addShape(P.shapes.RECTANGLE, { x: 0.6, y: 1.95, w: 5.95, h: 0.05, fill: { color: BLUE } })
    s.addText("Test (sandbox)", { x: 0.9, y: 2.2, w: 5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: BLUE })
    const test = ["Use Kadima sandbox credentials + a test card (4111 1111 1111 1111, 12/30, CVV 999).", "Run a full checkout: card and ACH.", "Confirm the order is paid and the webhook updates status."]
    test.forEach((t, i) => { s.addImage({ data: ic.check, x: 0.95, y: 2.8 + i * 0.95, w: 0.22, h: 0.22 }); s.addText(t, { x: 1.3, y: 2.74 + i * 0.95, w: 5.0, h: 0.9, fontFace: BODY, fontSize: 12, color: T2, valign: "top", lineSpacingMultiple: 1.12 }) })
    card(s, 6.78, 1.95, 5.95, 4.3)
    s.addShape(P.shapes.RECTANGLE, { x: 6.78, y: 1.95, w: 5.95, h: 0.05, fill: { color: GREEN } })
    s.addText("Go live (production)", { x: 7.08, y: 2.2, w: 5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: GREEN })
    const live = ["Set sandbox: false on both providers.", "Swap in your live Kadima token + terminal/dba.", "Point the webhook at your production URL.", "Take a small real transaction to confirm."]
    live.forEach((t, i) => { s.addImage({ data: ic.rocket, x: 7.08, y: 2.8 + i * 0.82, w: 0.22, h: 0.22 }); s.addText(t, { x: 7.42, y: 2.75 + i * 0.82, w: 5.1, h: 0.8, fontFace: BODY, fontSize: 12, color: T2, valign: "top", lineSpacingMultiple: 1.1 }) })
  }

  // 9 HOW IT WORKS
  {
    const s = P.addSlide(); base(s, pg())
    title(s, "How a card payment flows", "Card data never touches your servers — you stay in PCI SAQ-A scope.")
    const steps = [["Checkout", "Customer picks Kadima at checkout; a payment session is created."], ["Secure fields", "Kadima's Hosted Fields render; the customer types their card in Kadima's iframe."], ["Kadima processes", "The card is authorized by Kadima directly — the PAN never reaches your store."], ["Reconcile", "Kadima's signed webhook updates the Medusa order automatically."]]
    steps.forEach((st, i) => {
      const x = 0.6 + i * 3.07; card(s, x, 2.1, 2.85, 3.1)
      s.addShape(P.shapes.OVAL, { x: x + 0.28, y: 2.38, w: 0.6, h: 0.6, fill: { color: "0E2B1C" }, line: { color: GREEN, width: 1.5 } })
      s.addText(String(i + 1), { x: x + 0.28, y: 2.38, w: 0.6, h: 0.6, fontFace: HEAD, fontSize: 20, bold: true, color: GREEN, align: "center", valign: "middle" })
      s.addText(st[0], { x: x + 0.28, y: 3.15, w: 2.3, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: WHITE })
      s.addText(st[1], { x: x + 0.28, y: 3.6, w: 2.35, h: 1.5, fontFace: BODY, fontSize: 11, color: T2, valign: "top", lineSpacingMultiple: 1.1 })
      if (i < 3) s.addText("→", { x: x + 2.78, y: 3.45, w: 0.34, h: 0.4, fontSize: 18, color: GREEN, align: "center", bold: true })
    })
    s.addText("ACH works the same way, asynchronously: the order is placed as authorized, then settles or returns via webhook.", { x: 0.62, y: 5.5, w: 12, h: 0.5, fontFace: BODY, fontSize: 12, italic: true, color: MUTED })
  }

  // 10 RESOURCES
  {
    const s = P.addSlide(); base(s)
    s.addImage({ data: GRAD, x: 0, y: 0, w: W, h: 0.06 })
    s.addShape(P.shapes.OVAL, { x: 8.8, y: 3.0, w: 7, h: 7, fill: { color: "10303F" } })
    s.addImage({ path: LOGO, x: 0.85, y: 0.9, h: 0.42, w: 1.85 })
    s.addText("You're ready to accept payments", { x: 0.85, y: 2.0, w: 11, h: 0.8, fontFace: HEAD, fontSize: 34, bold: true, color: WHITE })
    s.addImage({ data: GRAD, x: 0.88, y: 2.9, w: 3.2, h: 0.045 })
    const res = [["npm", "npmjs.com/package/medusa-payment-kadima"], ["GitHub", "github.com/kadimapayments/medusa-payment-kadima"], ["Storefront guide", "the storefront/ folder in the package"], ["Support", "your Kadima rep · info@KadimaHQ.com"]]
    res.forEach((r, i) => { const y = 3.4 + i * 0.62; s.addImage({ data: ic.check, x: 0.9, y: y + 0.02, w: 0.26, h: 0.26 }); s.addText([{ text: r[0] + ":  ", options: { bold: true, color: GREEN } }, { text: r[1], options: { color: T2 } }], { x: 1.3, y, w: 10.5, h: 0.45, fontFace: BODY, fontSize: 14, valign: "middle" }) })
    s.addText("Card & ACH, straight through Kadima — no middle gateway.", { x: 0.9, y: 6.3, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: GREEN })
  }

  await P.writeFile({ fileName: path.join(DIR, "Kadima-Medusa-Install-Guide.pptx") })
  console.log("install deck written — " + _p + " indexed slides")
})().catch((e) => { console.error(e); process.exit(1) })
