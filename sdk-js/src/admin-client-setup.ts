import type { RequestOptions } from "./index.js";

export type ClientSetupOAuthPurposeProfile = "ingest" | "schema" | "reporting" | "lifecycle" | "broker";

// ClientSetupOAuthClientDesiredState deliberately has no secret field. Custd
// owns existing credentials and returns a secret only when create/rotation
// produces a one-time value.
export type ClientSetupOAuthClientDesiredState = {
  name?: string;
  clientId: string;
  purposeProfile: ClientSetupOAuthPurposeProfile;
  rotateSecret?: boolean;
};

export type ClientSetupSchemaDesiredState = {
  eventTypeSlug: string;
  version: string;
  schemaJson: Record<string, unknown>;
  dialect?: "jsonschema" | "avro";
  enabled: boolean;
};

export type ClientSetupPrivacyRule = {
  fieldPath: string;
  action: string;
  truncateLength?: number;
  enabled: boolean;
};

export type ClientSetupPrivacyDesiredState = {
  applyMode?: string;
  enabled: boolean;
  rules?: ClientSetupPrivacyRule[];
};

export type ClientSetupRetentionDesiredState = {
  maxAgeDays: number;
  classes: string[];
};

export type ClientSetupManifest = {
  schemas?: ClientSetupSchemaDesiredState[];
  privacy?: ClientSetupPrivacyDesiredState;
  retention?: ClientSetupRetentionDesiredState;
  oauthClients?: ClientSetupOAuthClientDesiredState[];
};

export type ClientSetupResourceStatus = {
  kind: string;
  key: string;
  state: string;
  ready: boolean;
  safeNextAction: string;
  safeNextActionCode: string;
};

export type ClientSetupOneTimeCredential = {
  clientId: string;
  clientSecret: string;
  purposeProfile: ClientSetupOAuthPurposeProfile;
};

export type ClientSetupApplyResponse = {
  tenantSlug: string;
  manifestDigest: string;
  ready: boolean;
  state: string;
  resources: ClientSetupResourceStatus[];
  credentials?: ClientSetupOneTimeCredential[];
  safeNextAction: string;
  safeNextActionCode: string;
  observedAt: string;
};

export type ClientSetupReadinessResponse = {
  tenantSlug: string;
  manifestDigest: string;
  ready: boolean;
  state: string;
  resources: ClientSetupResourceStatus[];
  safeNextAction: string;
  safeNextActionCode: string;
  observedAt: string;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class ClientSetupClient {
  constructor(private readonly request: AdminRequester) {}

  apply(
    tenantSlug: string,
    manifest: ClientSetupManifest,
    options?: RequestOptions,
  ): Promise<ClientSetupApplyResponse> {
    return this.request("PUT", `/tenant-manifest/${encodeURIComponent(tenantSlug)}`, manifest, options);
  }

  readiness(tenantSlug: string, options?: RequestOptions): Promise<ClientSetupReadinessResponse> {
    return this.request("GET", `/tenant-manifest/${encodeURIComponent(tenantSlug)}/readiness`, undefined, options);
  }
}
