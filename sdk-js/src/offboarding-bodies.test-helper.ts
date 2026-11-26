// Server-shaped offboarding bodies shared by the offboarding client and workflow tests. Each body
// carries the wire fields Custd's admin-api serializes (snake_case receipts and preview stores).
export const OFFBOARDING_REQUEST_UUID = "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ";

function requestState(state: string) {
  return { requestUuid: OFFBOARDING_REQUEST_UUID, state, requestedAt: "2026-07-31T08:00:00Z" };
}

const perStore = [
  { store: "postgres_events", retention_class: "operational", deleted_count: 1247, retained_exceptions_count: 0 },
  { store: "raw_landing", retention_class: "operational", deleted_count: 98, retained_exceptions_count: 0 },
  { store: "parquet_events", retention_class: "operational", deleted_count: 12, retained_exceptions_count: 0 },
];

export function offboardingReceipt(requestedByKind: "human" | "machine" = "human") {
  return {
    company_id: 42,
    requested_by_kind: requestedByKind,
    requested_at: "2026-07-31T08:00:00Z",
    completed_at: "2026-07-31T09:30:00Z",
    final_state: "complete",
    per_store: perStore,
    waiver: { role: "client_owner", timestamp: "2026-07-31T09:04:00Z" },
    sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  };
}

const downloadBytes = new TextEncoder().encode("custd offboarding export\n");

export const offboardingBodies = {
  created: requestState("preview"),
  exported: requestState("exported"),
  acknowledged: requestState("requested"),
  confirmed: requestState("confirmed"),
  preview: {
    requestUuid: OFFBOARDING_REQUEST_UUID,
    generatedAt: "2026-07-31T08:10:00Z",
    expiresAt: "2026-08-07T08:10:00Z",
    stores: [
      { store: "postgres_events", kind: "events", retention_class: "operational", estimated_count: 1247 },
      { store: "raw_landing", kind: "objects", retention_class: "operational", estimated_count: 98 },
      { store: "parquet_events", kind: "segments", retention_class: "operational", estimated_count: 12 },
    ],
    exclusions: null,
    previewInventoryDigest: "9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    complete: true,
    partial: false,
  },
  export: {
    requestUuid: OFFBOARDING_REQUEST_UUID,
    checksumSha256: "f406f3ba950df3722858bc1e5dcb275921d65a22d70784608a0e261ef1548577",
    byteSize: downloadBytes.byteLength,
    recordCount: 1357,
    generatedAt: "2026-07-31T08:30:00Z",
    expiresAt: "2026-08-07T08:30:00Z",
    previewInventoryDigest: "9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
  },
  receipt: offboardingReceipt(),
  /** The export artifact bytes and the integrity headers the download route sends with them. */
  download: {
    bytes: downloadBytes,
    checksumSha256: "f406f3ba950df3722858bc1e5dcb275921d65a22d70784608a0e261ef1548577",
    byteSize: downloadBytes.byteLength,
  },
};
