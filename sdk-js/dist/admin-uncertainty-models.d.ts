/**
 * Admin uncertainty models: named quantity models, their immutable versions and copies. Runs are
 * read and started through the analytics API (`CustdClient.measurement.uncertaintyModels`).
 */
import type { AppModelCopyRequest, AppModelCreate, AppModelQuantity, AppModelVersion, AppUncertaintyModel } from "./app-models.js";
import type { RequestOptions } from "./index.js";
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
/** Which models a list returns: those made in the admin console, by apps, or both. */
export type UncertaintyModelSource = "all" | "admin" | "app";
/** One model in a list, without its version. */
export type UncertaintyModelSummary = Omit<AppUncertaintyModel, "version" | "queuedRunFailure">;
export type UncertaintyModelList = {
    models: UncertaintyModelSummary[];
};
/** A new immutable version: the whole quantity list. */
export type UncertaintyModelVersionCreate = {
    quantities: AppModelQuantity[];
    note?: string;
};
export type UncertaintyModelVersionSummary = {
    versionUuid: string;
    versionNumber: number;
    note: string;
    quantityCount: number;
    createdAt: string;
};
export type UncertaintyModelVersionList = {
    versions: UncertaintyModelVersionSummary[];
};
export declare class UncertaintyModelAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(source?: UncertaintyModelSource, companySlug?: string): Promise<UncertaintyModelList>;
    get(modelUuid: string, companySlug?: string): Promise<AppUncertaintyModel>;
    create(body: AppModelCreate, companySlug?: string): Promise<AppUncertaintyModel>;
    copy(modelUuid: string, body?: AppModelCopyRequest, companySlug?: string): Promise<AppUncertaintyModel>;
    delete(modelUuid: string, companySlug?: string): Promise<void>;
    listVersions(modelUuid: string, companySlug?: string): Promise<UncertaintyModelVersionList>;
    getVersion(modelUuid: string, versionNumber: number, companySlug?: string): Promise<AppModelVersion>;
    createVersion(modelUuid: string, body: UncertaintyModelVersionCreate, companySlug?: string): Promise<AppModelVersion>;
}
export {};
