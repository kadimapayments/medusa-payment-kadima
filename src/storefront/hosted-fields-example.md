# Storefront — Hosted Fields card flow (PCI SAQ-A)

**Key fact from the complete API reference:** with Hosted Fields, the **browser
performs the payment itself**. The card never reaches the Medusa backend. The
backend reconciles the result via the `transaction/create` webhook (keyed by
`externalId`) and, for saved cards, by fetching the card token afterward.

So in Medusa terms:
- `initiatePayment` → mint a Hosted Fields Token and return it (+ `terminal.id`,
  `amount`, and `externalId = payment session_id`) to the storefront.
- The storefront renders `HostedFields.create({...})`; the customer pays in-browser.
- `authorizePayment` **reconciles** — it does not POST a card to `/payment/auth`.
  Authorization is driven by the `submit.result` event + the `transaction/create`
  webhook carrying the same `externalId`.

> The outbound `/payment/auth | /payment/sale` calls in `kadima-card-client.ts`
> are the **server-to-server** path, used only for stored CustomerVault tokens,
> recurring (MIT), and MOTO — not for new-card checkout.

## Mint the token (backend → from `initiatePayment`)

`POST https://kadimadashboard.com/api/hosted-fields/token`
```json
{ "terminal": 24, "domain": "https://store.example.com",
  "saveCard": "optional", "3ds": false, "expiration": 30 }
```
→ `{ "access_token": "…", "expires_at": "…", "expiration": 15 }`

## Render + pay (storefront)

```html
<div id="card-number"></div>
<div id="card-expiration"></div>
<div id="card-cvv"></div>
<div id="card-holder-name"></div>
<div id="submit-button"></div>

<!-- In sandbox load https://sandbox.kadimadashboard.com/js/HostedFields.js instead.
     The plugin passes the right URL to the React component as data.hfScriptUrl. -->
<script src="https://kadimadashboard.com/js/HostedFields.js"></script>
<script>
  // paymentSession.data comes from Medusa's initiatePayment output
  const { hostedFieldsToken, amount } = paymentSession.data
  // externalId MUST be the Medusa payment session id (top-level, NOT in .data).
  // The transaction/create webhook returns this id so Medusa matches & authorizes
  // the order. Using paymentSession.data.sessionId (undefined) leaves the order
  // stuck in "pending" forever.
  const externalId = paymentSession.id

  const form = HostedFields.create({
    token: hostedFieldsToken,       // pass the token directly (there is no setToken())
    amount,                         // Medusa v2 major units (e.g. 25.99) — no /100
    externalId,                     // Medusa payment session id, max 64 chars, unique
    fields: {
      cardNumber:     { target: "#card-number" },
      cardExpiration: { target: "#card-expiration" },
      cardCvv:        { target: "#card-cvv" },
      cardHolderName: { target: "#card-holder-name" },
      submit:         { target: "#submit-button" },
    },
  })

  form.addEventListener("submit.processing", () => showSpinner())
  form.addEventListener("submit.result", async (e) => {
    if (e.detail.result) {
      // Paid in-browser. Complete the cart; Medusa authorizes the session when the
      // transaction/create webhook (same externalId) arrives.
      await medusa.store.cart.complete(cartId)
    } // on false, a hostedFields.error event also fires
  })
  form.addEventListener("hostedFields.error", (e) => showError(e.detail))
</script>
```

## Saved card (only if `saveCard` was `required`/`optional` and user consented)

`POST https://kadimadashboard.com/api/hosted-fields/card-token`
```json
{ "accessToken": "ACCESS-TOKEN-USED-FOR-PAYMENT" }
```
→ returns the reusable card token to store as a payment method (CustomerVault).
Must be called before the Hosted Fields Token expires.

## 3DS / AMEX

If the token is issued with `3ds: true` and an AMEX card is entered, a
`hostedFields.shippingRequired` event fires — supply shipping/billing via
`form.setShippingInfo({...})`. `3ds.start` / `3ds.success` events report progress.
