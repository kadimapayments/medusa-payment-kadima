import { KadimaTxnStatus } from "../types"

/**
 * Kadima returns a rich set of decline reasons (see docs/2-Payment Gateway API.pdf).
 * We surface the raw reason but classify a few that Medusa / the storefront should
 * treat specially (retryable vs hard decline vs needs-action).
 */
export class KadimaError extends Error {
  constructor(
    message: string,
    readonly status: KadimaTxnStatus,
    readonly reason?: string | null,
    readonly raw?: unknown
  ) {
    super(message)
    this.name = "KadimaError"
  }
}

const RETRYABLE = new Set([
  "Time out",
  "System Error",
  "Error on Host",
  "Host connectivity failed",
  "Issuer or Switch inoperative",
  "Functionality currently not available",
])

export function isRetryable(reason?: string): boolean {
  return reason ? RETRYABLE.has(reason) : false
}

/** Throw if Kadima did not approve. */
export function assertApproved(resp: {
  status?: { status?: KadimaTxnStatus; reason?: string | null }
}): void {
  const s = resp.status?.status
  if (s !== "Approved") {
    throw new KadimaError(
      `Kadima transaction ${s ?? "Error"}: ${resp.status?.reason ?? "unknown"}`,
      s ?? "Error",
      resp.status?.reason,
      resp
    )
  }
}
