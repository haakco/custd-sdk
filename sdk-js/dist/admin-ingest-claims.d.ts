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
export type IngestClaimListResponse = {
    claims: IngestClaim[];
    truncated: boolean;
};
export type IngestClaimTerminalRequest = {
    failureClass: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class IngestClaimAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(tenantSlug: string, limit?: number, options?: RequestOptions): Promise<IngestClaimListResponse>;
    retry(tenantSlug: string, objectUuid: string, options?: RequestOptions): Promise<IngestClaim>;
    markTerminal(tenantSlug: string, objectUuid: string, body: IngestClaimTerminalRequest, options?: RequestOptions): Promise<IngestClaim>;
}
export {};
