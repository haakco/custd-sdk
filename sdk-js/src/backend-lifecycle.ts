import {
  type OffboardingAcknowledgeResponse,
  OffboardingClient,
  type OffboardingDownloadResponse,
  type OffboardingExecuteRequest,
  type OffboardingExecuteResponse,
  type OffboardingExportResponse,
  type OffboardingPreviewResponse,
  type OffboardingReceiptResponse,
  type OffboardingWaiver,
} from "./admin-offboarding.js";
import type {
  AdminOAuthClient,
  AdminOAuthClientSecretResponse,
  ClientSetupOAuthPurposeProfile,
  RequestOptions,
  RuntimeReadinessOptions,
  RuntimeReadinessResult,
} from "./index.js";
import { checkRuntimeReadiness } from "./runtime-readiness.js";

export type BackendLifecycleRequester = <T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
) => Promise<T>;

export type OneTimeCredentialSecret = {
  tenantSlug: string;
  clientId: string;
  purposeProfile: ClientSetupOAuthPurposeProfile;
  clientSecret: string;
};

export type PersistOneTimeCredentialSecret = (credential: OneTimeCredentialSecret) => void | Promise<void>;

export type RotateCredentialOptions = RequestOptions & {
  tenantSlug: string;
  clientId: string;
  purposeProfile: ClientSetupOAuthPurposeProfile;
  persistSecret: PersistOneTimeCredentialSecret;
};

export type RotateCredentialResult = {
  tenantSlug: string;
  clientId: string;
  purposeProfile: ClientSetupOAuthPurposeProfile;
  secretPersisted: true;
};

export type ZeroStateReconciliationResult = {
  zero: boolean;
  remaining?: readonly string[];
};

export type VerifyZeroState = (input: {
  tenantSlug: string;
  requestUuid: string;
  receipt: OffboardingReceiptResponse;
}) => ZeroStateReconciliationResult | Promise<ZeroStateReconciliationResult>;

export type ExportDeliveryVerificationResult = {
  verified: boolean;
  evidence?: string;
};

export type ReceiveAndVerifyOffboardingExport = (input: {
  tenantSlug: string;
  requestUuid: string;
  downloadUrl: string;
  export: OffboardingExportResponse;
}) => ExportDeliveryVerificationResult | Promise<ExportDeliveryVerificationResult>;

export type PersistOffboardingExport = (input: {
  tenantSlug: string;
  requestUuid: string;
  bytes: Uint8Array;
  checksumSha256: string;
}) => string | undefined | Promise<string | undefined>;

export type VerifiedExportReceiverOptions = {
  fetch?: typeof fetch;
  persist: PersistOffboardingExport;
};

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createVerifiedOffboardingExportReceiver(
  options: VerifiedExportReceiverOptions,
): ReceiveAndVerifyOffboardingExport {
  if (typeof options.persist !== "function") {
    throw new Error("Custd lifecycle requires an export persistence callback");
  }
  const fetchImpl = options.fetch ?? globalThis.fetch;
  return async ({ tenantSlug, requestUuid, downloadUrl, export: exported }) => {
    const response = await fetchImpl(downloadUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Custd lifecycle export download failed with status ${response.status}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== exported.byteSize) {
      throw new Error("Custd lifecycle export byte size did not match server metadata");
    }
    const digest = hex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)));
    if (digest !== exported.checksumSha256) {
      throw new Error("Custd lifecycle export checksum verification failed");
    }
    const evidence = await options.persist({ tenantSlug, requestUuid, bytes, checksumSha256: digest });
    return { verified: true, ...(evidence ? { evidence } : {}) };
  };
}

export type ZeroStateReconciliationOptions = {
  tenantSlug: string;
  requestUuid: string;
  receipt: OffboardingReceiptResponse;
  verifyZeroState: VerifyZeroState;
};

export type CompleteOffboardingOptions = RequestOptions & {
  tenantSlug: string;
  requestUuid: string;
  waiver: OffboardingWaiver;
  receiveAndVerifyExport: ReceiveAndVerifyOffboardingExport;
  verifyZeroState: VerifyZeroState;
};

export type CompleteOffboardingResult = {
  tenantSlug: string;
  requestUuid: string;
  preview?: OffboardingPreviewResponse;
  export?: OffboardingExportResponse;
  download: OffboardingDownloadResponse;
  exportDelivery: ExportDeliveryVerificationResult;
  acknowledgement: OffboardingAcknowledgeResponse;
  execution: OffboardingExecuteResponse;
  receipt: OffboardingReceiptResponse;
  zeroState: ZeroStateReconciliationResult;
};

const purposeProfiles: readonly ClientSetupOAuthPurposeProfile[] = [
  "ingest",
  "schema",
  "reporting",
  "lifecycle",
  "broker",
];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function requireText(name: string, value: unknown): asserts value is string {
  if (!nonEmpty(value)) throw new Error(`Custd lifecycle requires ${name}`);
}

function requirePurpose(value: unknown): asserts value is ClientSetupOAuthPurposeProfile {
  if (!purposeProfiles.includes(value as ClientSetupOAuthPurposeProfile)) {
    throw new Error(`Custd lifecycle does not support credential purpose "${String(value)}"`);
  }
}

function requireRequestUuid(value: unknown, expected: string, step: string): void {
  if (!value || typeof value !== "object" || (value as { requestUuid?: unknown }).requestUuid !== expected) {
    throw new Error(`Custd lifecycle ${step} returned a different offboarding request`);
  }
}

function requireReceipt(receipt: OffboardingReceiptResponse): void {
  if (receipt.finalState !== "complete") {
    throw new Error(`Custd lifecycle receipt is not complete (state ${receipt.finalState || "unknown"})`);
  }
}

function requireNonNegativeInteger(name: string, value: unknown): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Custd lifecycle requires valid ${name}`);
  }
}

function requirePositiveInteger(name: string, value: unknown): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Custd lifecycle requires valid ${name}`);
  }
}

function requireMatchingExportMetadata(
  exported: OffboardingExportResponse,
  download: OffboardingDownloadResponse,
): void {
  const matches = [
    exported.requestUuid === download.requestUuid,
    exported.checksumSha256 === download.checksumSha256,
    exported.byteSize === download.byteSize,
    exported.recordCount === download.recordCount,
    exported.generatedAt === download.generatedAt,
    exported.expiresAt === download.expiresAt,
    exported.previewInventoryDigest === download.previewInventoryDigest,
  ].every(Boolean);
  if (!matches) {
    throw new Error("Custd lifecycle export metadata did not match the download descriptor");
  }
}

function requireDownloadDescriptor(download: OffboardingDownloadResponse, expectedRequestUuid: string): void {
  requireRequestUuid(download, expectedRequestUuid, "download");
  requireText("offboarding download URL", download.downloadUrl);
  requireText("offboarding download checksum", download.checksumSha256);
  requirePositiveInteger("offboarding download byte size", download.byteSize);
  requireNonNegativeInteger("offboarding download record count", download.recordCount);
  requireText("offboarding download generated timestamp", download.generatedAt);
  requireText("offboarding download expiry", download.expiresAt);
  requireText("offboarding download preview digest", download.previewInventoryDigest);
}

function validateRotation(options: RotateCredentialOptions): void {
  requireText("tenant slug", options.tenantSlug);
  requireText("client ID", options.clientId);
  requirePurpose(options.purposeProfile);
  if (typeof options.persistSecret !== "function") {
    throw new Error("Custd lifecycle requires a one-time secret persistence callback");
  }
}

function validateOffboarding(options: CompleteOffboardingOptions): void {
  requireText("tenant slug", options.tenantSlug);
  requireText("offboarding request UUID", options.requestUuid);
  requireText("waiver role", options.waiver?.role);
  requireText("waiver reason", options.waiver?.reason);
  if (typeof options.receiveAndVerifyExport !== "function") {
    throw new Error("Custd lifecycle requires an export download, persistence, and verification callback");
  }
  if (typeof options.verifyZeroState !== "function") {
    throw new Error("Custd lifecycle requires a zero-state reconciliation callback");
  }
}

export class BackendLifecycleClient {
  private readonly offboarding: OffboardingClient;

  constructor(private readonly request: BackendLifecycleRequester) {
    this.offboarding = new OffboardingClient(request);
  }

  async rotateCredential(options: RotateCredentialOptions): Promise<RotateCredentialResult> {
    validateRotation(options);
    const existing = await this.request<AdminOAuthClient>(
      "GET",
      `/oauth-clients/${encodeURIComponent(options.clientId)}`,
      undefined,
      options,
    );
    if (existing.clientId !== options.clientId || existing.companySlug !== options.tenantSlug) {
      throw new Error("Custd lifecycle credential does not belong to the requested tenant");
    }
    const rotated = await this.request<AdminOAuthClientSecretResponse>(
      "POST",
      `/oauth-clients/${encodeURIComponent(options.clientId)}/rotate-secret`,
      undefined,
      options,
    );
    requireText("rotated client secret", rotated?.clientSecret);
    try {
      await options.persistSecret({
        tenantSlug: options.tenantSlug,
        clientId: options.clientId,
        purposeProfile: options.purposeProfile,
        clientSecret: rotated.clientSecret,
      });
    } catch {
      throw new Error(
        "Custd lifecycle credential rotation completed but secret persistence failed; reconcile before retrying",
      );
    }
    return {
      tenantSlug: options.tenantSlug,
      clientId: options.clientId,
      purposeProfile: options.purposeProfile,
      secretPersisted: true,
    };
  }

  verifyReadiness(options: RuntimeReadinessOptions): Promise<RuntimeReadinessResult> {
    return checkRuntimeReadiness(options);
  }

  async reconcileZeroState(options: ZeroStateReconciliationOptions): Promise<ZeroStateReconciliationResult> {
    requireText("tenant slug", options.tenantSlug);
    requireText("offboarding request UUID", options.requestUuid);
    if (typeof options.verifyZeroState !== "function") {
      throw new Error("Custd lifecycle requires a zero-state reconciliation callback");
    }
    let result: ZeroStateReconciliationResult;
    try {
      result = await options.verifyZeroState({
        tenantSlug: options.tenantSlug,
        requestUuid: options.requestUuid,
        receipt: options.receipt,
      });
    } catch {
      throw new Error("Custd lifecycle zero-state reconciliation failed");
    }
    if (result?.zero !== true) {
      throw new Error("Custd lifecycle zero-state reconciliation did not confirm an empty tenant");
    }
    return result;
  }

  async completeOffboarding(options: CompleteOffboardingOptions): Promise<CompleteOffboardingResult> {
    validateOffboarding(options);
    const current = await this.offboarding.getRequest(options.requestUuid, options);
    requireRequestUuid(current, options.requestUuid, "state");

    let preview: OffboardingPreviewResponse | undefined;
    let exported: OffboardingExportResponse | undefined;
    switch (current.state) {
      case "preview":
        preview = await this.offboarding.preview(options.requestUuid, options);
        requireRequestUuid(preview, options.requestUuid, "preview");
        if (!preview.complete || preview.partial) {
          throw new Error("Custd lifecycle offboarding preview is incomplete");
        }
        exported = await this.offboarding.export(options.requestUuid, options);
        requireRequestUuid(exported, options.requestUuid, "export");
        break;
      case "exported":
        break;
      default:
        throw new Error(`Custd lifecycle cannot complete offboarding from state ${current.state || "unknown"}`);
    }

    const download = await this.offboarding.download(options.requestUuid, options);
    requireDownloadDescriptor(download, options.requestUuid);
    if (exported) {
      requireMatchingExportMetadata(exported, download);
    }
    const exportDelivery = await options.receiveAndVerifyExport({
      tenantSlug: options.tenantSlug,
      requestUuid: options.requestUuid,
      downloadUrl: download.downloadUrl,
      export: download,
    });
    if (exportDelivery?.verified !== true) {
      throw new Error("Custd lifecycle export delivery was not verified");
    }
    const acknowledgement = await this.offboarding.acknowledge(options.requestUuid, options);
    requireRequestUuid(acknowledgement, options.requestUuid, "acknowledgement");
    const confirmation = await this.offboarding.confirmRequest(options.requestUuid, options);
    requireRequestUuid(confirmation, options.requestUuid, "confirmation");
    const execution = await this.offboarding.execute(
      options.requestUuid,
      { waiver: options.waiver } satisfies OffboardingExecuteRequest,
      options,
    );
    const receipt = await this.offboarding.receipt(options.requestUuid, options);
    requireReceipt(receipt);
    const zeroState = await this.reconcileZeroState({
      tenantSlug: options.tenantSlug,
      requestUuid: options.requestUuid,
      receipt,
      verifyZeroState: options.verifyZeroState,
    });
    return {
      tenantSlug: options.tenantSlug,
      requestUuid: options.requestUuid,
      ...(preview ? { preview } : {}),
      ...(exported ? { export: exported } : {}),
      download,
      exportDelivery,
      acknowledgement,
      execution,
      receipt,
      zeroState,
    };
  }
}
