"use client"
/**
 * Kadima ACH / eCheck — bank-debit payment element for a Medusa v2 storefront.
 *
 * Payment UI for the `kadima-ach` provider. Collects bank details, writes them to
 * the payment session's `data`, then completes the cart. The provider's
 * authorizePayment submits the ACH debit (status PENDING → authorized); the
 * `ach/updateStatus` webhook later settles or returns it.
 *
 * ACH is asynchronous: the order is placed as "authorized", not captured. Make
 * that clear to the customer (funds settle in 1–4 business days).
 *
 * Wire:
 *   updateSession(sessionId, data) → set the session's data (e.g. your server
 *     action calling sdk.store.payment.* or your cart update endpoint)
 *   onPlaced() → complete the cart / place the order
 */
import { useState } from "react"

export function KadimaAchForm({
  sessionId,
  updateSession,
  onPlaced,
  onError,
}: {
  sessionId: string
  updateSession: (sessionId: string, data: Record<string, unknown>) => Promise<void>
  onPlaced: () => void | Promise<void>
  onError?: (e: unknown) => void
}) {
  const [f, setF] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    accountType: "Checking",
    email: "",
    secCode: "WEB",
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: string) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: any) => {
    e.preventDefault()
    setErr("")
    if (!f.accountName || !/^\d{4,17}$/.test(f.accountNumber) || !/^\d{9}$/.test(f.routingNumber)) {
      setErr("Enter a valid account name, account number, and 9-digit routing number.")
      return
    }
    setBusy(true)
    try {
      await updateSession(sessionId, {
        accountName: f.accountName,
        accountNumber: f.accountNumber,
        routingNumber: f.routingNumber,
        accountType: f.accountType,
        secCode: f.secCode,
        customer: { email: f.email, identifier: sessionId }, // identifier = reconciliation key
      })
      await onPlaced()
    } catch (e2) {
      setErr("Could not submit the bank payment. Please check the details and try again.")
      onError?.(e2)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="kadima-ach" onSubmit={submit}>
      <input className="kadima-input" placeholder="Account holder name" value={f.accountName} onChange={set("accountName")} />
      <input className="kadima-input" placeholder="Account number" inputMode="numeric" value={f.accountNumber} onChange={set("accountNumber")} />
      <input className="kadima-input" placeholder="Routing number (9 digits)" inputMode="numeric" value={f.routingNumber} onChange={set("routingNumber")} />
      <select className="kadima-input" value={f.accountType} onChange={set("accountType")}>
        <option>Checking</option>
        <option>Savings</option>
      </select>
      <input className="kadima-input" type="email" placeholder="Email for receipt" value={f.email} onChange={set("email")} />
      {err && <p className="kadima-ach-error">{err}</p>}
      <p className="kadima-ach-note">Funds settle in 1–4 business days. Your order is confirmed once authorized.</p>
      <button className="kadima-submit" type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Pay by bank (ACH)"}
      </button>
    </form>
  )
}

export default KadimaAchForm
