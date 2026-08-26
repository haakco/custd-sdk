import type { PackDefinition, RequestOptions } from "./index.js";

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

export type ClientSetupReportingPackDesiredState = {
  definition: PackDefinition;
  expectedRevision?: number;
};

export type ClientSetupManifest = {
  schemas?: ClientSetupSchemaDesiredState[];
  privacy?: ClientSetupPrivacyDesiredState;
  retention?: ClientSetupRetentionDesiredState;
  reportingPacks?: ClientSetupReportingPackDesiredState[];
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

export type ClientSetupApplyAndWaitOptions = RequestOptions & {
  timeoutMs?: number;
  intervalMs?: number;
};

export type ClientSetupApplyAndWaitResult = {
  apply: ClientSetupApplyResponse;
  readiness: ClientSetupReadinessResponse;
};

const setupManifestKeys = new Set(["schemas", "privacy", "retention", "reportingPacks", "oauthClients"]);
const setupPurposeProfiles: readonly ClientSetupOAuthPurposeProfile[] = [
  "ingest",
  "schema",
  "reporting",
  "lifecycle",
  "broker",
];
const setupRetentionClasses = new Set(["raw", "archive", "materialized", "cache", "object"]);
const setupPrivacyActions = new Set(["keep", "hash", "truncate", "remove", "strip_query", "origin"]);
// Three independent runtime consumers reconcile on a 15-second interval. The
// last acknowledgement can require one further cycle before activation.
const defaultSetupReadinessTimeoutMs = 45_000;
const defaultSetupReadinessIntervalMs = 1_000;

// validateClientSetupManifest mirrors the manifest's client-visible shape so
// malformed configuration fails before it reaches the Admin API. Server-side
// validation remains authoritative for full reporting-pack semantics.
export function validateClientSetupManifest(manifest: ClientSetupManifest): void {
  if (!isRecord(manifest)) {
    throw new Error("custd: tenant manifest must be an object");
  }
  for (const key of Object.keys(manifest)) {
    if (!setupManifestKeys.has(key)) {
      throw new Error(`custd: tenant manifest field ${key} is not supported`);
    }
  }
  validateSetupSchemas(manifest.schemas);
  validateSetupPrivacy(manifest.privacy);
  validateSetupRetention(manifest.retention);
  validateSetupReportingPacks(manifest.reportingPacks);
  validateSetupOAuthClients(manifest.oauthClients);
}

function validateSetupSchemas(schemas: unknown): void {
  if (schemas === undefined) return;
  if (!Array.isArray(schemas)) throw new Error("custd: manifest schemas must be an array");
  const seen = new Set<string>();
  schemas.forEach((value, index) => {
    const schema = setupRecord(value, `schemas[${index}]`);
    const eventTypeSlug = setupString(schema.eventTypeSlug, `schemas[${index}].eventTypeSlug`);
    const version = setupString(schema.version, `schemas[${index}].version`);
    if (!isRecord(schema.schemaJson)) throw new Error(`custd: schemas[${index}].schemaJson must be an object`);
    if (schema.dialect !== undefined && schema.dialect !== "jsonschema" && schema.dialect !== "avro") {
      throw new Error(`custd: schemas[${index}].dialect is unsupported`);
    }
    if (typeof schema.enabled !== "boolean") throw new Error(`custd: schemas[${index}].enabled must be a boolean`);
    const key = `${eventTypeSlug}@${version}`;
    if (seen.has(key)) throw new Error(`custd: duplicate schema ${key}`);
    seen.add(key);
  });
}

function validateSetupPrivacy(privacy: unknown): void {
  if (privacy === undefined) return;
  const value = setupRecord(privacy, "privacy");
  if (value.applyMode !== undefined && typeof value.applyMode !== "string") {
    throw new Error("custd: privacy.applyMode must be a string");
  }
  if (typeof value.enabled !== "boolean") throw new Error("custd: privacy.enabled must be a boolean");
  if (value.rules === undefined) return;
  if (!Array.isArray(value.rules)) throw new Error("custd: privacy.rules must be an array");
  value.rules.forEach((entry, index) => {
    const rule = setupRecord(entry, `privacy.rules[${index}]`);
    setupString(rule.fieldPath, `privacy.rules[${index}].fieldPath`);
    const action = setupString(rule.action, `privacy.rules[${index}].action`);
    if (!setupPrivacyActions.has(action)) throw new Error(`custd: privacy.rules[${index}].action is unsupported`);
    if (typeof rule.enabled !== "boolean") {
      throw new Error(`custd: privacy.rules[${index}].enabled must be a boolean`);
    }
    if (rule.truncateLength !== undefined && (!isInteger(rule.truncateLength) || rule.truncateLength < 1)) {
      throw new Error(`custd: privacy.rules[${index}].truncateLength must be positive`);
    }
  });
}

function validateSetupRetention(retention: unknown): void {
  if (retention === undefined) return;
  const value = setupRecord(retention, "retention");
  if (!isInteger(value.maxAgeDays) || value.maxAgeDays < 1) {
    throw new Error("custd: retention.maxAgeDays must be positive");
  }
  if (!Array.isArray(value.classes) || value.classes.length === 0) {
    throw new Error("custd: retention.classes must be a non-empty array");
  }
  const seen = new Set<string>();
  value.classes.forEach((entry, index) => {
    const className = setupString(entry, `retention.classes[${index}]`);
    if (!setupRetentionClasses.has(className)) throw new Error(`custd: retention class ${className} is unsupported`);
    if (seen.has(className)) throw new Error(`custd: duplicate retention class ${className}`);
    seen.add(className);
  });
}

function validateSetupReportingPacks(packs: unknown): void {
  if (packs === undefined) return;
  if (!Array.isArray(packs)) throw new Error("custd: manifest reportingPacks must be an array");
  const seen = new Set<string>();
  packs.forEach((entry, index) => {
    const desired = setupRecord(entry, `reportingPacks[${index}]`);
    const definition = setupRecord(desired.definition, `reportingPacks[${index}].definition`);
    const key = setupString(definition.key, `reportingPacks[${index}].definition.key`);
    setupString(definition.displayName, `reportingPacks[${index}].definition.displayName`);
    if (typeof definition.enabled !== "boolean") {
      throw new Error(`custd: reportingPacks[${index}].definition.enabled must be a boolean`);
    }
    if (!Array.isArray(definition.eventTypes) || !definition.eventTypes.every((item) => typeof item === "string")) {
      throw new Error(`custd: reportingPacks[${index}].definition.eventTypes must be an array of strings`);
    }
    if (
      desired.expectedRevision !== undefined &&
      (!isInteger(desired.expectedRevision) || desired.expectedRevision < 0)
    ) {
      throw new Error(`custd: reportingPacks[${index}].expectedRevision must be a non-negative integer`);
    }
    if (Object.keys(desired).includes("clientSecret")) {
      throw new Error("custd: client secrets are managed by Custd");
    }
    if (seen.has(key)) throw new Error(`custd: duplicate reporting pack ${key}`);
    seen.add(key);
  });
}

function validateSetupOAuthClients(clients: unknown): void {
  if (clients === undefined) return;
  if (!Array.isArray(clients)) throw new Error("custd: manifest oauthClients must be an array");
  const seen = new Set<string>();
  clients.forEach((entry, index) => {
    const client = setupRecord(entry, `oauthClients[${index}]`);
    const clientId = setupString(client.clientId, `oauthClients[${index}].clientId`);
    if (!setupPurposeProfiles.includes(client.purposeProfile as ClientSetupOAuthPurposeProfile)) {
      throw new Error(`custd: oauthClients[${index}].purposeProfile is unsupported`);
    }
    if (client.name !== undefined && typeof client.name !== "string") {
      throw new Error(`custd: oauthClients[${index}].name must be a string`);
    }
    if (client.rotateSecret !== undefined && typeof client.rotateSecret !== "boolean") {
      throw new Error(`custd: oauthClients[${index}].rotateSecret must be a boolean`);
    }
    if (Object.keys(client).includes("clientSecret")) {
      throw new Error("custd: client secrets are managed by Custd");
    }
    if (seen.has(clientId)) throw new Error(`custd: duplicate oauth client ${clientId}`);
    seen.add(clientId);
  });
}

function setupRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`custd: ${field} must be an object`);
  return value;
}

function setupString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`custd: ${field} must be non-empty`);
  return value;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setupWaitDuration(value: number | undefined, fallback: number, field: string): number {
  const duration = value ?? fallback;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`custd: ${field} must be a positive finite number`);
  }
  return duration;
}

function setupRequestOptions(options: ClientSetupApplyAndWaitOptions): RequestOptions | undefined {
  return options.signal ? { signal: options.signal } : undefined;
}

function waitForSetupReadiness(intervalMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer);
      reject(signal?.reason ?? new Error("custd: tenant manifest readiness wait aborted"));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, intervalMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function readinessTimeoutError(tenantSlug: string, readiness: ClientSetupReadinessResponse, timeoutMs: number): Error {
  const code = readiness.safeNextActionCode || "unknown";
  return new Error(
    `custd: timed out waiting for tenant manifest readiness for "${tenantSlug}" after ${timeoutMs}ms ` +
      `(action=${readiness.safeNextAction || "unknown"}, code=${code})`,
  );
}

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class ClientSetupClient {
  constructor(private readonly request: AdminRequester) {}

  async apply(
    tenantSlug: string,
    manifest: ClientSetupManifest,
    options?: RequestOptions,
  ): Promise<ClientSetupApplyResponse> {
    validateClientSetupManifest(manifest);
    return this.request("PUT", `/tenant-manifest/${encodeURIComponent(tenantSlug)}`, manifest, options);
  }

  readiness(tenantSlug: string, options?: RequestOptions): Promise<ClientSetupReadinessResponse> {
    return this.request("GET", `/tenant-manifest/${encodeURIComponent(tenantSlug)}/readiness`, undefined, options);
  }

  async applyAndWait(
    tenantSlug: string,
    manifest: ClientSetupManifest,
    options: ClientSetupApplyAndWaitOptions = {},
  ): Promise<ClientSetupApplyAndWaitResult> {
    const timeoutMs = setupWaitDuration(options.timeoutMs, defaultSetupReadinessTimeoutMs, "timeoutMs");
    const intervalMs = setupWaitDuration(options.intervalMs, defaultSetupReadinessIntervalMs, "intervalMs");
    const requestOptions = setupRequestOptions(options);
    const apply = await this.apply(tenantSlug, manifest, requestOptions);
    let readiness: ClientSetupReadinessResponse = apply;
    const deadline = Date.now() + timeoutMs;
    while (!readiness.ready && readiness.safeNextAction === "retry") {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) throw readinessTimeoutError(tenantSlug, readiness, timeoutMs);
      await waitForSetupReadiness(Math.min(intervalMs, remainingMs), options.signal);
      readiness = await this.readiness(tenantSlug, requestOptions);
    }
    if (!readiness.ready && readiness.safeNextAction === "retry") {
      throw readinessTimeoutError(tenantSlug, readiness, timeoutMs);
    }
    return { apply, readiness };
  }
}
