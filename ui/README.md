# Kadima Integration Console

A Kadima-branded admin console that drives the integration against the live Kadima
sandbox. It is a standalone Node server today; the same endpoints port directly into
the Kadima ops dashboard as admin routes later.

## Run

```bash
cd medusa-payment-kadima
KADIMA_TOKEN='<sandbox token>' \
KADIMA_WEBHOOK='<webhook secret>' \
KADIMA_TERMINAL=404 KADIMA_DBA=466 \
npx tsx ui/server.ts
# → http://localhost:4242
```

The API token is read from the environment and **held server-side** — it is never
sent to the browser. The frontend only ever talks to this server's `/api/*` proxy.

## What it does

- **Overview** — capability map (card, ACH, vault, 3DS, account updater, webhooks).
- **Hosted Fields** — mint a single-use token and render Kadima's secure card fields
  for a real SAQ-A payment (card never touches our backend).
- **Card (S2S)** — authorize → capture → refund, tokenize, $0 verify, against the
  sandbox gateway.
- **ACH / eCheck** — create a debit, refresh status, void.
- **Customer Vault** — chained customer → billing → tokenized card, then list cards.
- **Webhooks** — receives Kadima events at `/api/webhooks/kadima`, verifies the
  SHA-512 signature, and lists them.

## Wiring into the ops dashboard later

The console is intentionally split:
- `ui/server.ts` — thin proxy over the verified clients in `src/lib/*`. Port these
  handlers into the ops panel's API (`api/ops/...`) using the merchant's stored token.
- `ui/public/*` — brand-matched frontend (Manrope, `#31be72`→`#27a9e2` gradient, dark
  theme) that can be embedded as an ops-panel page or iframe.

## Brand assets

`ui/assets/logo-white.svg`, `logo-dark.svg`, and PNG variants are copied from the
Kadima Payments site so the console matches `kadimapayments.com` exactly.
