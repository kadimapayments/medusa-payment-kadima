/**
 * Per-merchant configuration. Decisions (see docs/DESIGN.md):
 *  - per-merchant token model (each merchant supplies their own Kadima token)
 *  - configurable card capture (auth→capture vs sale)
 *
 * CONFIRMED (Kadima_Dashboard_API_COMPLETE.md): one per-merchant Dashboard
 * Access Token (Bearer) covers BOTH the card gateway and the ACH API. The card
 * and ACH options take the same token value.
 */
export interface KadimaCardOptions {
  /** Per-merchant Dashboard Access Token (Authorization: Bearer ...). */
  apiToken: string
  /** Kadima system terminal id — identifies this merchant's MID/TID. */
  terminalId: number
  /** Kadima DBA id — required only for CustomerVault (saved cards / account holders). */
  dbaId?: number
  /** Signing secret for this merchant's webhook endpoint. */
  webhookSecret: string
  /** "auth" = authorize then capture later; "sale" = auth + capture together. */
  captureMethod?: "auth" | "sale"
  /** Use the sandbox gateway host. */
  sandbox?: boolean
}

export interface KadimaAchOptions {
  /** Per-merchant ACH access token. */
  apiToken: string
  /** Kadima DBA id — identifies this merchant for ACH. */
  dbaId: number
  /** Signing secret for this merchant's webhook endpoint. */
  webhookSecret: string
  /** Default SEC code. WEB/TEL are debit-only; PPD/CCD allow credit (refunds). */
  secCode?: "PPD" | "CCD" | "WEB" | "TEL"
  /** ACH sandbox host, once Kadima confirms one exists (Phase-0 #3). */
  sandbox?: boolean
}

export const CARD_HOSTS = {
  prod: "https://gateway.kadimadashboard.com",
  sandbox: "https://sandbox-gateway.kadimadashboard.com",
} as const

/** Hosted Fields token + ACH live on the dashboard host, not the gateway host. */
export const DASHBOARD_HOSTS = {
  prod: "https://kadimadashboard.com",
  // CONFIRMED: dashboard/ACH sandbox host (distinct from the card gateway sandbox).
  sandbox: "https://sandbox.kadimadashboard.com",
} as const

/** Kadima transaction outcome. */
export type KadimaTxnStatus = "Approved" | "Declined" | "Error"

/** Kadima ACH lifecycle statuses (Kadima_Dashboard_API_COMPLETE.md). */
export type KadimaAchStatus =
  | "Voided"
  | "Hold"
  | "Pending"
  | "Submitted"
  | "Transmitted"
  | "Settled"
  | "Returned"
