import type { EventRollupDimensionProfile } from "./admin-event-types.js";
import type { PackDefinition, RequestOptions } from "./index.js";
export type ClientSetupOAuthPurposeProfile = "ingest" | "schema" | "reporting" | "lifecycle" | "broker";
export type ClientSetupOAuthClientDesiredState = {
    name?: string;
    clientId: string;
    purposeProfile: ClientSetupOAuthPurposeProfile;
    /** The environment the client's events default to. */
    environment?: string;
};
/** An event type's desired rollup dimensions. */
export type ClientSetupEventTypeDesiredState = {
    eventTypeSlug: string;
    rollupDimensions: EventRollupDimensionProfile;
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
    eventTypeConfigs?: ClientSetupEventTypeDesiredState[];
};
export type ClientSetupResourceStatus = {
    kind: string;
    key: string;
    state: string;
    ready: boolean;
    safeNextAction: string;
    safeNextActionCode: string;
    detail?: string;
};
/** Why a pending operation is waiting, and when it tries again. */
export type ClientSetupOperationPending = {
    nextAttemptAt: string;
    lastFailure?: {
        code: string;
        observedAt: string;
        resources: ClientSetupResourceStatus[] | null;
    };
};
export type ClientSetupOperationStatus = {
    uuid: string;
    idempotencyKey: string;
    state: string;
    errorCode?: string;
    attemptCount: number;
    leaseExpiresAt?: string;
    pending?: ClientSetupOperationPending;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
};
export type ClientSetupApplyResponse = {
    tenantSlug: string;
    manifestDigest: string;
    ready: boolean;
    state: string;
    resources: ClientSetupResourceStatus[];
    safeNextAction: string;
    safeNextActionCode: string;
    observedAt: string;
    operation?: ClientSetupOperationStatus;
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
    operation?: ClientSetupOperationStatus;
};
export type ClientSetupApplyOptions = RequestOptions & {
    idempotencyKey: string;
};
export type ClientSetupApplyAndWaitOptions = ClientSetupApplyOptions & {
    timeoutMs?: number;
    intervalMs?: number;
};
export type ClientSetupApplyAndWaitResult = {
    apply: ClientSetupApplyResponse;
    readiness: ClientSetupReadinessResponse;
};
export declare function validateClientSetupManifest(manifest: ClientSetupManifest): void;
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class ClientSetupClient {
    private readonly request;
    constructor(request: AdminRequester);
    apply(tenantSlug: string, manifest: ClientSetupManifest, options: ClientSetupApplyOptions): Promise<ClientSetupApplyResponse>;
    readiness(tenantSlug: string, options?: RequestOptions): Promise<ClientSetupReadinessResponse>;
    applyAndWait(tenantSlug: string, manifest: ClientSetupManifest, options: ClientSetupApplyAndWaitOptions): Promise<ClientSetupApplyAndWaitResult>;
}
export {};
