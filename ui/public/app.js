// Kadima Integration Console — frontend logic
const $ = (id) => document.getElementById(id)
const api = async (path, body) => {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return r.json()
}
const show = (resEl, pillEl, preEl, out, title, titleEl) => {
  resEl.classList.add("show")
  if (titleEl && title) titleEl.textContent = title
  const ok = out.ok !== false
  pillEl.className = "pill " + (ok ? "ok" : "err")
  pillEl.textContent = ok ? "Approved / OK" : "Declined / Error"
  preEl.textContent = JSON.stringify(out.data ?? out, null, 2)
  return ok ? out.data : null
}

// ---- tab nav ----
const titles = { overview: "Overview", hf: "Hosted Fields", card: "Card (Server-to-Server)", ach: "ACH / eCheck", vault: "Customer Vault", webhooks: "Webhooks" }
$("nav").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return
  const tab = b.dataset.tab
  document.querySelectorAll(".nav button").forEach((x) => x.classList.toggle("active", x === b))
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab))
  $("title").textContent = titles[tab]
  if (tab === "webhooks") loadWebhooks()
})

// ---- config ----
api("/api/config").then((c) => {
  if (c.terminalId) $("f-term").textContent = c.terminalId
  if (c.dbaId) $("f-dba").textContent = c.dbaId
})

// ========== HOSTED FIELDS ==========
let hfForm = null
$("hf-mint").addEventListener("click", async () => {
  const out = await api("/api/hf-token", { saveCard: $("hf-save").value, domain: location.origin })
  const data = show($("hf-token-res"), $("hf-token-pill"), $("hf-token-pre"), out)
  if (!data) return
  $("hf-status").textContent = "Rendering Kadima secure fields…"
  try {
    if (hfForm && hfForm.destroy) hfForm.destroy()
    hfForm = HostedFields.create({
      token: data.access_token,
      amount: Number($("hf-amount").value),
      externalId: $("hf-ext").value,
      fields: {
        cardNumber: { target: "#hf-card-number" },
        cardExpiration: { target: "#hf-card-expiration" },
        cardCvv: { target: "#hf-card-cvv" },
        cardHolderName: { target: "#hf-card-holder-name" },
        submit: { target: "#hf-submit" },
      },
    })
    hfForm.addEventListener("hostedFields.ready", () => ($("hf-status").textContent = "Ready — enter a test card and submit."))
    hfForm.addEventListener("submit.processing", () => ($("hf-status").textContent = "Processing payment…"))
    hfForm.addEventListener("submit.result", (e) => {
      $("hf-status").textContent = e.detail && e.detail.result
        ? "✓ Payment approved — reconcile via the transaction/create webhook (externalId = " + $("hf-ext").value + ")."
        : "✗ Payment failed — see the hostedFields.error event."
    })
    hfForm.addEventListener("hostedFields.error", (e) => ($("hf-status").textContent = "Error: " + JSON.stringify(e.detail)))
  } catch (err) {
    $("hf-status").textContent = "HostedFields.js error: " + err
  }
})

// ========== CARD S2S ==========
let lastCardId = null
const cardBody = () => ({
  amount: Number($("c-amt").value),
  externalId: "demo-s2s-" + Date.now(),
  card: { name: "John Wick", number: $("c-num").value, exp: $("c-exp").value, cvv: $("c-cvv").value },
})
$("c-auth").addEventListener("click", async () => {
  const out = await api("/api/card/auth", cardBody())
  const d = show($("c-res"), $("c-pill"), $("c-pre"), out, "Authorize", $("c-res-t"))
  lastCardId = d && d.id
  $("c-cap").disabled = !lastCardId; $("c-ref").disabled = !lastCardId
})
$("c-cap").addEventListener("click", async () => {
  const out = await api(`/api/card/${lastCardId}/capture`, { amount: Number($("c-amt").value) })
  show($("c-res"), $("c-pill"), $("c-pre"), out, "Capture", $("c-res-t"))
})
$("c-ref").addEventListener("click", async () => {
  const out = await api(`/api/card/${lastCardId}/refund`, { amount: Number($("c-amt").value) })
  show($("c-res"), $("c-pill"), $("c-pre"), out, "Refund", $("c-res-t"))
})
$("c-tok").addEventListener("click", async () => {
  const out = await api("/api/card/generate-token", cardBody())
  show($("c-res"), $("c-pill"), $("c-pre"), out, "Tokenize", $("c-res-t"))
})
$("c-zero").addEventListener("click", async () => {
  const out = await api("/api/card/card-auth", cardBody())
  show($("c-res"), $("c-pill"), $("c-pre"), out, "$0 verify", $("c-res-t"))
})

// ========== ACH ==========
let lastAchId = null
$("a-debit").addEventListener("click", async () => {
  const out = await api("/api/ach/debit", {
    amount: Number($("a-amt").value),
    secCode: $("a-sec").value,
    accountName: $("a-name").value,
    accountNumber: $("a-acct").value,
    routingNumber: $("a-route").value,
    accountType: $("a-type").value,
    customer: { email: $("a-email").value, identifier: "demo-ach-" + Date.now() },
  })
  const d = show($("a-res"), $("a-pill"), $("a-pre"), out, "Create debit", $("a-res-t"))
  lastAchId = d && d.id
  $("a-get").disabled = !lastAchId; $("a-void").disabled = !lastAchId
})
$("a-get").addEventListener("click", async () => {
  const out = await api(`/api/ach/${lastAchId}`)
  show($("a-res"), $("a-pill"), $("a-pre"), out, "ACH status", $("a-res-t"))
})
$("a-void").addEventListener("click", async () => {
  const out = await api(`/api/ach/${lastAchId}/void`, {})
  show($("a-res"), $("a-pill"), $("a-pre"), out, "Void", $("a-res-t"))
})

// ========== VAULT ==========
let lastVaultCust = null
$("v-run").addEventListener("click", async () => {
  $("v-res").classList.add("show"); $("v-res-t").textContent = "Vault flow"; $("v-pre").textContent = "Creating customer…"
  const cust = await api("/api/vault/customer", {
    firstName: $("v-first").value, lastName: $("v-last").value,
    email: $("v-email").value, phone: $("v-phone").value, identificator: "demo-vault-" + Date.now(),
  })
  if (cust.ok === false) return show($("v-res"), $("v-pill"), $("v-pre"), cust, "Vault flow", $("v-res-t"))
  lastVaultCust = cust.data.id
  $("v-pre").textContent = "Customer " + lastVaultCust + " created. Adding billing…"
  const bill = await api(`/api/vault/${lastVaultCust}/billing`, {
    firstName: $("v-first").value, lastName: $("v-last").value,
    address: "8320 Some Ave", city: "Calabasas", state: "CA", country: "US", zip: "85284",
  })
  if (bill.ok === false) return show($("v-res"), $("v-pill"), $("v-pre"), bill, "Vault flow (billing)", $("v-res-t"))
  $("v-pre").textContent = "Billing " + bill.data.id + " created. Adding card…"
  const cardOut = await api(`/api/vault/${lastVaultCust}/card`, {
    number: $("v-num").value, exp: $("v-exp").value, cvv: $("v-cvv").value,
    holderName: $("v-first").value + " " + $("v-last").value, billingId: bill.data.id,
  })
  show($("v-res"), $("v-pill"), $("v-pre"), {
    ok: cardOut.ok, data: { customer: cust.data, billing: bill.data, card: cardOut.data ?? cardOut.error },
  }, "Vault flow", $("v-res-t"))
  $("v-list").disabled = !lastVaultCust
})
$("v-list").addEventListener("click", async () => {
  const out = await api(`/api/vault/${lastVaultCust}/cards`)
  show($("v-res"), $("v-pill"), $("v-pre"), out, "Saved cards", $("v-res-t"))
})

// ========== WEBHOOKS ==========
async function loadWebhooks() {
  const out = await api("/api/webhooks/log")
  const body = $("wh-body"), empty = $("wh-empty")
  body.innerHTML = ""
  if (!out.items || !out.items.length) { empty.style.display = "block"; return }
  empty.style.display = "none"
  out.items.forEach((it) => {
    const ev = it.event || {}
    const tr = document.createElement("tr")
    tr.innerHTML = `<td>${it.receivedAt.replace("T"," ").slice(0,19)}</td><td>${ev.module||"—"}</td><td>${ev.action||"—"}</td><td>${it.valid?'<span class="pill ok">valid</span>':'<span class="pill err">invalid</span>'}</td>`
    body.appendChild(tr)
  })
}
$("wh-refresh").addEventListener("click", loadWebhooks)
