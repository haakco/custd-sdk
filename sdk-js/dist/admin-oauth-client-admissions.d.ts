/**
 * OAuth client admissions. A dynamically registered client asks for grants; a tenant administrator
 * reviews the client's metadata, approves the grants it should hold, or revokes it. Every mutation
 * names the revision it was decided against, so a stale decision is rejected.
 */
import type { RequestOptions } from "./index.js";
/** The scopes one client may hold on one resource. */
export type OAuthClientAdmissionGrant = {
    resourceUri: string;
    scopes: string[];
};
export type OAuthClientAdmission = {
    admissionUuid: string;
    clientId: string;
    companyUuid: string;
    revision: number;
    requestedGrants: OAuthClientAdmissionGrant[];
    requestedSecurityRevision: string;
    approvedGrants: OAuthClientAdmissionGrant[];
    approvedSecurityRevision?: string;
    approvedAt?: string;
    revokedAt?: string;
};
export type OAuthClientAdmissionListResponse = {
    admissions: OAuthClientAdmission[];
};
/** The registered client's public metadata a review needs. */
export type OAuthClientAdmissionMetadata = {
    clientName: string;
    redirectUris: string[];
    securityRevision: string;
    expiresAt: string;
};
export type OAuthClientAdmissionReviewRequest = {
    companySlug: string;
};
export type OAuthClientAdmissionReviewResponse = {
    admission: OAuthClientAdmission;
    metadata: OAuthClientAdmissionMetadata;
};
export type OAuthClientAdmissionApproveRequest = {
    companySlug: string;
    clientId: string;
    expectedRevision: number;
    securityRevision: string;
    grants: OAuthClientAdmissionGrant[];
};
export type OAuthClientAdmissionRevokeRequest = {
    companySlug: string;
    expectedRevision: number;
};
export type OAuthClientAdmissionMutationResponse = {
    admission: OAuthClientAdmission;
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class OAuthClientAdmissionAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(companySlug: string, options?: RequestOptions): Promise<OAuthClientAdmissionListResponse>;
    review(admissionUuid: string, body: OAuthClientAdmissionReviewRequest, options?: RequestOptions): Promise<OAuthClientAdmissionReviewResponse>;
    approve(admissionUuid: string, body: OAuthClientAdmissionApproveRequest, options?: RequestOptions): Promise<OAuthClientAdmissionMutationResponse>;
    revoke(admissionUuid: string, body: OAuthClientAdmissionRevokeRequest, options?: RequestOptions): Promise<OAuthClientAdmissionMutationResponse>;
    private mutate;
}
export {};
