import { type OffboardingAcknowledgeResponse, type OffboardingDownloadResponse, type OffboardingExecuteResponse, type OffboardingExportResponse, type OffboardingPreviewResponse, type OffboardingReceiptResponse } from "./admin-offboarding.js";
import type { ClientSetupOAuthPurposeProfile, RequestOptions, RuntimeReadinessOptions, RuntimeReadinessResult } from "./index.js";
export type BackendLifecycleRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export type BackendLifecycleDownloader = (path: string, options?: RequestOptions) => Promise<OffboardingDownloadResponse>;
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
    download: OffboardingDownloadResponse;
    export?: OffboardingExportResponse;
}) => ExportDeliveryVerificationResult | Promise<ExportDeliveryVerificationResult>;
export type PersistOffboardingExport = (input: {
    tenantSlug: string;
    requestUuid: string;
    bytes: Uint8Array;
    checksumSha256: string;
}) => string | undefined | Promise<string | undefined>;
export type VerifiedExportReceiverOptions = {
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
export declare class BackendLifecycleClient {
    private readonly request;
    private readonly offboarding;
    constructor(request: BackendLifecycleRequester, offboardingDownload: BackendLifecycleDownloader);
    rotateCredential(options: RotateCredentialOptions): Promise<RotateCredentialResult>;
    verifyReadiness(options: RuntimeReadinessOptions): Promise<RuntimeReadinessResult>;
    reconcileZeroState(options: ZeroStateReconciliationOptions): Promise<ZeroStateReconciliationResult>;
    completeOffboarding(options: CompleteOffboardingOptions): Promise<CompleteOffboardingResult>;
}
