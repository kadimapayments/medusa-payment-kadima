/* Capture real console screenshots for the onboarding deck. */
const puppeteer = require("puppeteer")
const fs = require("fs")
const path = require("path")

const OUT = path.join(__dirname, "shots")
fs.mkdirSync(OUT, { recursive: true })
const URL = "http://localhost:4242"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 940, deviceScaleFactor: 2 })

  const shot = async (name, h = 940) => {
    await page.setViewport({ width: 1440, height: h, deviceScaleFactor: 2 })
    await sleep(350)
    await page.screenshot({ path: path.join(OUT, name) })
    console.log("shot", name)
  }
  const tab = async (t) => { await page.click(`button[data-tab="${t}"]`); await sleep(500) }
  const waitShow = async (sel) => { try { await page.waitForFunction((s)=>document.querySelector(s)&&document.querySelector(s).classList.contains("show"),{timeout:15000},sel) } catch {} ; await sleep(500) }

  await page.goto(URL, { waitUntil: "networkidle2" })
  await sleep(700)
  await shot("01-overview.png", 1480)

  // Hosted Fields — mint token
  await tab("hf")
  await page.click("#hf-mint")
  await waitShow("#hf-token-res")
  await sleep(1500) // let HF iframes render
  await shot("02-hosted-fields.png", 1180)

  // Card S2S — authorize then capture
  await tab("card")
  await page.click("#c-auth")
  await waitShow("#c-res")
  await shot("03-card-auth.png", 1080)
  await page.click("#c-cap")
  await sleep(1500)
  await shot("04-card-capture.png", 1080)

  // ACH — create debit
  await tab("ach")
  await page.click("#a-debit")
  await waitShow("#a-res")
  await shot("05-ach-debit.png", 1120)

  // Vault — full flow
  await tab("vault")
  await page.click("#v-run")
  await waitShow("#v-res")
  await sleep(2500)
  await shot("06-vault.png", 1120)

  // Webhooks
  await tab("webhooks")
  await sleep(500)
  await shot("07-webhooks.png", 900)

  await browser.close()
  console.log("done")
})().catch((e) => { console.error(e); process.exit(1) })
