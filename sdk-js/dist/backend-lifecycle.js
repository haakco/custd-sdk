import { OffboardingClient, } from "./admin-offboarding.js";
import { checkRuntimeReadiness } from "./runtime-readiness.js";
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
function requireReceipt(receipt, tenantSlug, requestUuid) {
    requireRequestUuid(receipt, requestUuid, "receipt");
    if (receipt.tenantSlug !== tenantSlug) {
        throw new Error("Custd lifecycle receipt belongs to a different tenant");
    }
    if (receipt.finalState !== "complete") {
        throw new Error(`Custd lifecycle receipt is not complete (state ${receipt.finalState || "unknown"})`);
    }
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
        const preview = await this.offboarding.preview(options.requestUuid, options);
        requireRequestUuid(preview, options.requestUuid, "preview");
        const exported = await this.offboarding.export(options.requestUuid, options);
        requireRequestUuid(exported, options.requestUuid, "export");
        if (exported.complete === false) {
            throw new Error("Custd lifecycle offboarding export is incomplete");
        }
        const acknowledgement = await this.offboarding.acknowledge(options.requestUuid, options);
        requireRequestUuid(acknowledgement, options.requestUuid, "acknowledgement");
        await this.offboarding.confirmRequest(options.requestUuid, options);
        const execution = await this.offboarding.execute(options.requestUuid, { waiver: options.waiver }, options);
        requireRequestUuid(execution, options.requestUuid, "execution");
        const receipt = await this.offboarding.receipt(options.requestUuid, options);
        requireReceipt(receipt, options.tenantSlug, options.requestUuid);
        const zeroState = await this.reconcileZeroState({
            tenantSlug: options.tenantSlug,
            requestUuid: options.requestUuid,
            receipt,
            verifyZeroState: options.verifyZeroState,
        });
        return {
            tenantSlug: options.tenantSlug,
            requestUuid: options.requestUuid,
            preview,
            export: exported,
            acknowledgement,
            execution,
            receipt,
            zeroState,
        };
    }
}
