/**
 * Time-boxed support access grants: a tenant lets a HaakCo operator into its data for a stated
 * reason until a stated time, and can revoke the grant early.
 */
import type { RequestOptions } from "./index.js";
/** One grant. `revokedAt` is null until the grant is revoked. */
export type SupportAccessGrant = {
    supportAccessGrantUuid: string;
    companySlug: string;
    operatorUserUuid: string;
    reason: string;
    startsAt: string;
    expiresAt: string;
    revokedAt: string | null;
};
export type SupportAccessGrantListResponse = {
    grants: SupportAccessGrant[];
};
export type SupportAccessGrantCreateRequest = {
    companySlug: string;
    reason: string;
    expiresAt: string;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class SupportAccessAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(companySlug?: string, options?: RequestOptions): Promise<SupportAccessGrantListResponse>;
    create(body: SupportAccessGrantCreateRequest, options?: RequestOptions): Promise<SupportAccessGrant>;
    revoke(supportAccessGrantUuid: string, options?: RequestOptions): Promise<void>;
}
export {};
