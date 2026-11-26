/**
 * OAuth client admissions. A dynamically registered client asks for grants; a tenant administrator
 * reviews the client's metadata, approves the grants it should hold, or revokes it. Every mutation
 * names the revision it was decided against, so a stale decision is rejected.
 */

import type { RequestOptions } from "./index.js";

/** The scopes one client may hold on one resource. */
export type OAuthClientAdmissionGrant = { resourceUri: string; scopes: string[] };

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

export type OAuthClientAdmissionListResponse = { admissions: OAuthClientAdmission[] };

/** The registered client's public metadata a review needs. */
export type OAuthClientAdmissionMetadata = {
  clientName: string;
  redirectUris: string[];
  securityRevision: string;
  expiresAt: string;
};

export type OAuthClientAdmissionReviewRequest = { companySlug: string };

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

export type OAuthClientAdmissionRevokeRequest = { companySlug: string; expectedRevision: number };

export type OAuthClientAdmissionMutationResponse = { admission: OAuthClientAdmission };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

const admissionsPath = "/oauth-client-admissions";

export class OAuthClientAdmissionAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(companySlug: string, options?: RequestOptions): Promise<OAuthClientAdmissionListResponse> {
    const path = `${admissionsPath}?companySlug=${encodeURIComponent(companySlug)}`;
    const list = await this.request<OAuthClientAdmissionListResponse>("GET", path, undefined, options);
    return { admissions: (list.admissions ?? []).map(normalizeAdmission) };
  }

  async review(
    admissionUuid: string,
    body: OAuthClientAdmissionReviewRequest,
    options?: RequestOptions,
  ): Promise<OAuthClientAdmissionReviewResponse> {
    const review = await this.request<OAuthClientAdmissionReviewResponse>(
      "POST",
      `${admissionPath(admissionUuid)}/review`,
      body,
      options,
    );
    return {
      admission: normalizeAdmission(review.admission),
      metadata: { ...review.metadata, redirectUris: review.metadata.redirectUris ?? [] },
    };
  }

  approve(
    admissionUuid: string,
    body: OAuthClientAdmissionApproveRequest,
    options?: RequestOptions,
  ): Promise<OAuthClientAdmissionMutationResponse> {
    return this.mutate(`${admissionPath(admissionUuid)}/approve`, body, options);
  }

  revoke(
    admissionUuid: string,
    body: OAuthClientAdmissionRevokeRequest,
    options?: RequestOptions,
  ): Promise<OAuthClientAdmissionMutationResponse> {
    return this.mutate(`${admissionPath(admissionUuid)}/revoke`, body, options);
  }

  private async mutate(
    path: string,
    body: object,
    options?: RequestOptions,
  ): Promise<OAuthClientAdmissionMutationResponse> {
    const response = await this.request<OAuthClientAdmissionMutationResponse>("POST", path, body, options);
    return { admission: normalizeAdmission(response.admission) };
  }
}

function admissionPath(admissionUuid: string): string {
  return `${admissionsPath}/${encodeURIComponent(admissionUuid)}`;
}

function normalizeGrants(grants: OAuthClientAdmissionGrant[] | null): OAuthClientAdmissionGrant[] {
  return (grants ?? []).map((grant) => ({ ...grant, scopes: grant.scopes ?? [] }));
}

function normalizeAdmission(admission: OAuthClientAdmission): OAuthClientAdmission {
  return {
    ...admission,
    requestedGrants: normalizeGrants(admission.requestedGrants),
    approvedGrants: normalizeGrants(admission.approvedGrants),
  };
}
