import { describe, it, expect } from "vitest"
import { createHash } from "crypto"
import { computeSignature, verifySignature } from "./webhook"

// Per Kadima_Dashboard_API_COMPLETE.md:
//   Webhook-Signature = SHA-512( <webhookSignature><id><module><action><date> )
const SECRET = "whsec_test_123"
const envelope = {
  id: 876,
  module: "transaction",
  action: "create",
  date: "2023-05-09 15:23:44",
}

describe("webhook signature", () => {
  it("computes SHA-512 hex of secret+id+module+action+date in that order", () => {
    const expected = createHash("sha512")
      .update(`${SECRET}876transactioncreate2023-05-09 15:23:44`)
      .digest("hex")
    expect(computeSignature(SECRET, envelope)).toBe(expected)
  })

  it("verifies a correct signature", () => {
    const sig = computeSignature(SECRET, envelope)
    expect(verifySignature(SECRET, envelope, sig)).toBe(true)
  })

  it("rejects a tampered payload (action changed)", () => {
    const sig = computeSignature(SECRET, envelope)
    expect(verifySignature(SECRET, { ...envelope, action: "refund" }, sig)).toBe(false)
  })

  it("rejects a wrong secret", () => {
    const sig = computeSignature(SECRET, envelope)
    expect(verifySignature("wrong_secret", envelope, sig)).toBe(false)
  })

  it("rejects a missing/empty header", () => {
    expect(verifySignature(SECRET, envelope, undefined)).toBe(false)
    expect(verifySignature(SECRET, envelope, "")).toBe(false)
  })

  it("rejects a signature of wrong length without throwing", () => {
    expect(verifySignature(SECRET, envelope, "abc123")).toBe(false)
  })

  it("is order-sensitive (id and module not interchangeable)", () => {
    const a = computeSignature(SECRET, envelope)
    const b = computeSignature(SECRET, {
      ...envelope,
      id: "transaction" as unknown as number,
      module: "876",
    })
    expect(a).not.toBe(b)
  })
})
