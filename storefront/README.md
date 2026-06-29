# Storefront integration (Medusa v2 / Next.js)

Two copy-paste components for your storefront's checkout payment step:

- `KadimaHostedFields.tsx` — card, via Kadima Hosted Fields (PCI SAQ-A; the PAN
  never touches your storefront or backend).
- `KadimaAchForm.tsx` — ACH / eCheck bank debit.

Both are framework-light: they take the active **payment session** and callbacks,
so you wire them to your own Medusa SDK calls.

## 1. Render the right component per provider

In your checkout payment step, after a payment session is created for the chosen
provider, render:

```tsx
{session.provider_id === "pp_kadima-card_kadima-card" && (
  <KadimaHostedFields
    session={session}
    amount={cart.total} {/* Medusa v2 totals are already major units (e.g. 25.99) — do NOT divide by 100 */}
    onPaid={() => completeCart(cart.id)}
  />
)}

{session.provider_id === "pp_kadima-ach_kadima-ach" && (
  <KadimaAchForm
    sessionId={session.id}
    updateSession={updatePaymentSessionData}
    onPlaced={() => completeCart(cart.id)}
  />
)}
```

> Provider ids follow Medusa's `pp_<provider>_<id>` scheme. Confirm yours from
> `GET /store/payment-providers`.

## 2. Helpers to implement (your SDK wiring)

```ts
import { sdk } from "@lib/config" // your Medusa JS SDK instance

// Complete the cart → places the order.
async function completeCart(cartId: string) {
  const res = await sdk.store.cart.complete(cartId)
  if (res.type === "order") window.location.href = `/order/confirmed/${res.order.id}`
}

// ACH: write bank details onto the payment session before completing.
async function updatePaymentSessionData(sessionId: string, data: Record<string, unknown>) {
  // Use your cart's payment-session update path; data is merged into the session
  // and read by the kadima-ach provider's authorizePayment.
  await sdk.store.payment.updateSession?.(sessionId, { data })
}
```

## 3. Card flow (what happens)

1. `initiatePayment` returns `data.hostedFieldsToken` + `data.hfScriptUrl`.
2. `KadimaHostedFields` loads `HostedFields.js`, renders the secure iframe fields,
   and sets `externalId = session.id`.
3. Customer submits → Kadima processes the card → `submit.result` fires → you
   `completeCart()`.
4. Kadima's `transaction/create` webhook hits your Medusa app at
   `/hooks/payment/kadima-card`; the provider authorizes the session (matched by
   `externalId`).

## 4. Minimal styles

```css
.kadima-pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
#kadima-card-number, .kadima-submit { grid-column:1/-1; }
.kadima-field { border:1px solid #d1d5db; border-radius:8px; padding:6px 10px; min-height:44px; }
.kadima-input { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:10px 12px; margin-bottom:10px; }
.kadima-submit button, .kadima-submit { width:100%; padding:12px; border-radius:8px;
  background:linear-gradient(90deg,#31be72,#27a9e2); color:#04140c; font-weight:700; border:0; cursor:pointer; }
.kadima-ach-note { font-size:12px; color:#6b7280; } .kadima-ach-error,.kadima-pay-error { color:#dc2626; font-size:13px; }
```
