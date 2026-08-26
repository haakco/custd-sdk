import { type OffboardingAcknowledgeResponse, type OffboardingExecuteResponse, type OffboardingExportResponse, type OffboardingPreviewResponse, type OffboardingReceiptResponse, type OffboardingWaiver } from "./admin-offboarding.js";
import type { ClientSetupOAuthPurposeProfile, RequestOptions, RuntimeReadinessOptions, RuntimeReadinessResult } from "./index.js";
export type BackendLifecycleRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
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
export declare function createVerifiedOffboardingExportReceiver(options: VerifiedExportReceiverOptions): ReceiveAndVerifyOffboardingExport;
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
    preview: OffboardingPreviewResponse;
    export: OffboardingExportResponse;
    download: {
        downloadUrl: string;
    };
    exportDelivery: ExportDeliveryVerificationResult;
    acknowledgement: OffboardingAcknowledgeResponse;
    execution: OffboardingExecuteResponse;
    receipt: OffboardingReceiptResponse;
    zeroState: ZeroStateReconciliationResult;
};
export declare class BackendLifecycleClient {
    private readonly request;
    private readonly offboarding;
    constructor(request: BackendLifecycleRequester);
    rotateCredential(options: RotateCredentialOptions): Promise<RotateCredentialResult>;
    verifyReadiness(options: RuntimeReadinessOptions): Promise<RuntimeReadinessResult>;
    reconcileZeroState(options: ZeroStateReconciliationOptions): Promise<ZeroStateReconciliationResult>;
    completeOffboarding(options: CompleteOffboardingOptions): Promise<CompleteOffboardingResult>;
}
