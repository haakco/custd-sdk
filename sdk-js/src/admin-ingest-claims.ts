/**
 * Accepted-event landing claims: the durable objects ingest landed for a tenant and their processing
 * state. An operator can retry a claim or mark it terminal with a failure class.
 */

import type { RequestOptions } from "./index.js";

export type IngestClaim = {
  objectId: number;
  objectUuid: string;
  windowStart: string;
  eventCount: number;
  byteCount: number;
  processingState: string;
  claimAttempts: number;
  claimExpiresAt?: string;
  processedAt?: string;
  failedAt?: string;
  failureClass?: string;
};

/** A bounded page of claims; `truncated` is true when more exist than were returned. */
export type IngestClaimListResponse = { claims: IngestClaim[]; truncated: boolean };

export type IngestClaimTerminalRequest = { failureClass: string };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class IngestClaimAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(tenantSlug: string, limit?: number, options?: RequestOptions): Promise<IngestClaimListResponse> {
    const query = limit === undefined ? "" : `?limit=${encodeURIComponent(String(limit))}`;
    const list = await this.request<IngestClaimListResponse>(
      "GET",
      `${tenantPath(tenantSlug)}${query}`,
      undefined,
      options,
    );
    return { ...list, claims: list.claims ?? [] };
  }

  retry(tenantSlug: string, objectUuid: string, options?: RequestOptions): Promise<IngestClaim> {
    return this.request("POST", `${claimPath(tenantSlug, objectUuid)}/retry`, undefined, options);
  }

  markTerminal(
    tenantSlug: string,
    objectUuid: string,
    body: IngestClaimTerminalRequest,
    options?: RequestOptions,
  ): Promise<IngestClaim> {
    return this.request("POST", `${claimPath(tenantSlug, objectUuid)}/terminal`, body, options);
  }
}

function tenantPath(tenantSlug: string): string {
  return `/ingest/claims/${encodeURIComponent(tenantSlug)}`;
}

function claimPath(tenantSlug: string, objectUuid: string): string {
  return `${tenantPath(tenantSlug)}/${encodeURIComponent(objectUuid)}`;
}
