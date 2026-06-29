"use client"
/**
 * Kadima Hosted Fields — card payment element for a Medusa v2 (Next.js) storefront.
 *
 * Drop this in as the payment UI for the `kadima-card` provider. The card number
 * is entered in Kadima's secure iframe — it never touches your storefront or
 * Medusa backend (PCI SAQ-A). On success the cart is completed; Medusa authorizes
 * the payment when Kadima's `transaction/create` webhook arrives (matched by the
 * externalId we pass = the payment session id).
 *
 * The payment session's `data` (from the provider's initiatePayment) carries:
 *   { hostedFieldsToken, terminalId, amount, currency_code, hfScriptUrl }
 *
 * Wire `onPaid` to your "place order" flow (e.g. sdk.store.cart.complete(cartId)).
 */
import { useEffect, useRef, useState } from "react"

declare global {
  interface Window { HostedFields?: any }
  // HostedFields.js defines a top-level `class HostedFields` — a global *lexical*
  // binding, NOT a property of window. So `window.HostedFields` is undefined; the
  // bare global `HostedFields` is what resolves. Declare it for TS/bundlers.
  const HostedFields: any
}

/**
 * Resolve the HostedFields class across environments — CSP-safe (no eval/Function).
 * Prefers window (future-proof if Kadima ever assigns it) then the bare lexical global.
 */
function resolveHostedFields(): any {
  const w = window as any
  if (w && w.HostedFields) return w.HostedFields
  if (typeof HostedFields !== "undefined") return HostedFields
  return null
}

type Session = {
  id: string
  data?: {
    hostedFieldsToken?: string
    amount?: number | string
    hfScriptUrl?: string // e.g. https://sandbox.kadimadashboard.com/js/HostedFields.js
  }
}

export function KadimaHostedFields({
  session,
  amount,
  onPaid,
  onError,
}: {
  session: Session
  amount: number
  onPaid: () => void | Promise<void>
  onError?: (e: unknown) => void
}) {
  const formRef = useRef<any>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "error">("loading")
  const [message, setMessage] = useState("")

  const token = session?.data?.hostedFieldsToken
  const scriptUrl = session?.data?.hfScriptUrl || "https://kadimadashboard.com/js/HostedFields.js"

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (resolveHostedFields()) return resolve()
        // Reuse an in-flight/previous tag instead of injecting duplicates.
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)
        if (existing) {
          existing.addEventListener("load", () => resolve())
          existing.addEventListener("error", () => reject(new Error("Failed to load HostedFields.js")))
          if (resolveHostedFields()) resolve()
          return
        }
        const s = document.createElement("script")
        s.src = scriptUrl
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("Failed to load HostedFields.js"))
        document.head.appendChild(s)
      })

    loadScript()
      .then(() => {
        if (cancelled) return
        const HF = resolveHostedFields()
        if (!HF) {
          setStatus("error")
          setMessage("Could not initialize the secure card library. Check that HostedFields.js loaded.")
          return
        }
        const form = HF.create({
          token,
          amount,
          externalId: session.id, // ← reconciliation key (Medusa payment session id)
          fields: {
            cardNumber: { target: "#kadima-card-number" },
            cardExpiration: { target: "#kadima-card-exp" },
            cardCvv: { target: "#kadima-card-cvv" },
            cardHolderName: { target: "#kadima-card-name" },
            submit: { target: "#kadima-card-submit" },
          },
        })
        formRef.current = form
        form.addEventListener("hostedFields.ready", () => setStatus("ready"))
        form.addEventListener("submit.processing", () => setStatus("processing"))
        form.addEventListener("submit.result", async (e: any) => {
          if (e?.detail?.result) {
            try { await onPaid() } catch (err) { onError?.(err) }
          } else {
            setStatus("error"); setMessage("Payment was declined. Please try another card.")
          }
        })
        form.addEventListener("hostedFields.error", (e: any) => {
          setStatus("error"); setMessage("Payment error. Please try again."); onError?.(e?.detail)
        })
      })
      .catch((err) => { setStatus("error"); setMessage(String(err)); onError?.(err) })

    return () => { cancelled = true; try { formRef.current?.destroy?.() } catch {} }
  }, [token, scriptUrl, amount, session?.id])

  if (!token) return <div className="kadima-pay-error">Payment session not ready.</div>

  return (
    <div className="kadima-pay">
      <div className="kadima-pay-grid">
        <div id="kadima-card-number" className="kadima-field" />
        <div id="kadima-card-exp" className="kadima-field" />
        <div id="kadima-card-cvv" className="kadima-field" />
        <div id="kadima-card-name" className="kadima-field" />
        <div id="kadima-card-submit" className="kadima-submit" />
      </div>
      <p className="kadima-pay-status" aria-live="polite">
        {status === "loading" && "Loading secure card fields…"}
        {status === "ready" && "Enter your card details and submit."}
        {status === "processing" && "Processing payment…"}
        {status === "error" && message}
      </p>
    </div>
  )
}

export default KadimaHostedFields
