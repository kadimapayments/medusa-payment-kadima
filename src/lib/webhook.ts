import { createHash } from "crypto"

/**
 * Kadima signs every webhook with:
 *   Webhook-Signature: SHA-512( webhookSecret + id + module + action + date )
 *
 * This is the same scheme the Kadima Payments website already uses in
 * api/webhooks/kadima.js for boarding webhooks. We re-implement it here so the
 * plugin has no dependency on that repo.
 */
export interface KadimaWebhookEnvelope {
  id: string | number
  module: string // "transaction" | "ach" | "chargeback" | ...
  action: string // "create" | "updateStatus" | ...
  date: string
  data?: Record<string, unknown>
}

export function computeSignature(
  secret: string,
  envelope: Pick<KadimaWebhookEnvelope, "id" | "module" | "action" | "date">
): string {
  const payload = `${secret}${envelope.id}${envelope.module}${envelope.action}${envelope.date}`
  return createHash("sha512").update(payload).digest("hex")
}

/** Constant-time-ish compare of the header against the expected signature. */
export function verifySignature(
  secret: string,
  envelope: KadimaWebhookEnvelope,
  headerSignature: string | undefined
): boolean {
  if (!headerSignature) return false
  const expected = computeSignature(secret, envelope)
  if (expected.length !== headerSignature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ headerSignature.charCodeAt(i)
  }
  return diff === 0
}
