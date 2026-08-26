import { OffboardingClient, } from "./admin-offboarding.js";
import { checkRuntimeReadiness } from "./runtime-readiness.js";
function hex(bytes) {
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}
export function createVerifiedOffboardingExportReceiver(options) {
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
const purposeProfiles = [
    "ingest",
    "schema",
    "reporting",
    "lifecycle",
    "broker",
];
function nonEmpty(value) {
    return typeof value === "string" && value.trim() !== "";
}
function requireText(name, value) {
    if (!nonEmpty(value))
        throw new Error(`Custd lifecycle requires ${name}`);
}
function requirePurpose(value) {
    if (!purposeProfiles.includes(value)) {
        throw new Error(`Custd lifecycle does not support credential purpose "${String(value)}"`);
    }
}
function requireRequestUuid(value, expected, step) {
    if (!value || typeof value !== "object" || value.requestUuid !== expected) {
        throw new Error(`Custd lifecycle ${step} returned a different offboarding request`);
    }
}
function requireReceipt(receipt) {
    if (receipt.finalState !== "complete") {
        throw new Error(`Custd lifecycle receipt is not complete (state ${receipt.finalState || "unknown"})`);
    }
}
function requireNonNegativeInteger(name, value) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
        throw new Error(`Custd lifecycle requires valid ${name}`);
    }
}
function requirePositiveInteger(name, value) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`Custd lifecycle requires valid ${name}`);
    }
}
function requireMatchingExportMetadata(exported, download) {
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
function requireDownloadDescriptor(download, expectedRequestUuid) {
    requireRequestUuid(download, expectedRequestUuid, "download");
    requireText("offboarding download URL", download.downloadUrl);
    requireText("offboarding download checksum", download.checksumSha256);
    requirePositiveInteger("offboarding download byte size", download.byteSize);
    requireNonNegativeInteger("offboarding download record count", download.recordCount);
    requireText("offboarding download generated timestamp", download.generatedAt);
    requireText("offboarding download expiry", download.expiresAt);
    requireText("offboarding download preview digest", download.previewInventoryDigest);
}
function validateRotation(options) {
    requireText("tenant slug", options.tenantSlug);
    requireText("client ID", options.clientId);
    requirePurpose(options.purposeProfile);
    if (typeof options.persistSecret !== "function") {
        throw new Error("Custd lifecycle requires a one-time secret persistence callback");
    }
}
function validateOffboarding(options) {
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
    constructor(request) {
        this.request = request;
        this.offboarding = new OffboardingClient(request);
    }
    async rotateCredential(options) {
        validateRotation(options);
        const existing = await this.request("GET", `/oauth-clients/${encodeURIComponent(options.clientId)}`, undefined, options);
        if (existing.clientId !== options.clientId || existing.companySlug !== options.tenantSlug) {
            throw new Error("Custd lifecycle credential does not belong to the requested tenant");
        }
        const rotated = await this.request("POST", `/oauth-clients/${encodeURIComponent(options.clientId)}/rotate-secret`, undefined, options);
        requireText("rotated client secret", rotated?.clientSecret);
        try {
            await options.persistSecret({
                tenantSlug: options.tenantSlug,
                clientId: options.clientId,
                purposeProfile: options.purposeProfile,
                clientSecret: rotated.clientSecret,
            });
        }
        catch {
            throw new Error("Custd lifecycle credential rotation completed but secret persistence failed; reconcile before retrying");
        }
        return {
            tenantSlug: options.tenantSlug,
            clientId: options.clientId,
            purposeProfile: options.purposeProfile,
            secretPersisted: true,
        };
    }
    verifyReadiness(options) {
        return checkRuntimeReadiness(options);
    }
    async reconcileZeroState(options) {
        requireText("tenant slug", options.tenantSlug);
        requireText("offboarding request UUID", options.requestUuid);
        if (typeof options.verifyZeroState !== "function") {
            throw new Error("Custd lifecycle requires a zero-state reconciliation callback");
        }
        let result;
        try {
            result = await options.verifyZeroState({
                tenantSlug: options.tenantSlug,
                requestUuid: options.requestUuid,
                receipt: options.receipt,
            });
        }
        catch {
            throw new Error("Custd lifecycle zero-state reconciliation failed");
        }
        if (result?.zero !== true) {
            throw new Error("Custd lifecycle zero-state reconciliation did not confirm an empty tenant");
        }
        return result;
    }
    async completeOffboarding(options) {
        validateOffboarding(options);
        const current = await this.offboarding.getRequest(options.requestUuid, options);
        requireRequestUuid(current, options.requestUuid, "state");
        let preview;
        let exported;
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
        const execution = await this.offboarding.execute(options.requestUuid, { waiver: options.waiver }, options);
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
