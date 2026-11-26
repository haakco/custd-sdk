import type { RequestOptions, StorageLimit, StorageMeasurementState } from "./index.js";
/** The row cap the service applies when a request omits a limit. */
export declare const USAGE_DEFAULT_LIMIT = 500;
/** The most rows the usage endpoint returns in one request. */
export declare const USAGE_MAX_LIMIT = 5000;
/** How final one usage row is. The server derives it and owns its meaning. */
export type UsageCompletenessState = "provisional" | "final" | "corrected" | "incomplete";
/** One attributed usage quantity for one half-open UTC window. */
export type UsageRow = {
    accountCompanySlug: string;
    dataSpaceCompanySlug: string;
    meterSlug: string;
    meterVersion: number;
    unit: string;
    windowStart: string;
    windowEnd: string;
    quantity: number;
    sourceWatermark: number;
    completenessState: UsageCompletenessState;
    correctionGeneration: number;
    calculationVersion: number;
};
/** A meter total across every row returned for the window. */
export type UsageTotal = {
    accountCompanySlug: string;
    dataSpaceCompanySlug: string;
    meterSlug: string;
    unit: string;
    quantity: number;
};
/** Attributed usage for the token's own tenant. */
export type UsageReport = {
    schemaVersion: string;
    companySlug?: string;
    start: string;
    end: string;
    rows: UsageRow[];
    totals: UsageTotal[];
    sourceWatermark: number;
    containsProvisional: boolean;
    containsIncomplete: boolean;
};
/**
 * Narrows and bounds the usage window.
 *
 * Omitting `start` and `end` uses the service default, the trailing 30 days
 * ending now; omitting `limit` uses {@link USAGE_DEFAULT_LIMIT}.
 */
export type UsageQuery = {
    meterSlug?: string;
    /** Inclusive RFC3339 UTC window start. */
    start?: string;
    /** Exclusive RFC3339 UTC window end. */
    end?: string;
    /** Maximum rows, between 1 and {@link USAGE_MAX_LIMIT}. */
    limit?: number;
};
/** A usage window for the system-admin views, optionally narrowed to one company. */
export type UsageAdminQuery = UsageQuery & {
    companySlug?: string;
};
/** Where a tenant's retained bytes are held. */
export type StorageUsageBreakdown = {
    dbCoreLogicalBytes: number;
    dbRawInlineLogicalBytes: number;
    s3RawBytes: number;
    s3RawObjectCount: number;
    s3ParquetArchiveBytes: number;
    s3ParquetArchiveObjectCount: number;
    parquetArchiveAttribution: string;
};
/** One tenant's retained storage against its limit. */
export type TenantStorageUsage = {
    companySlug: string;
    companyName: string;
    attributedStorageBytes: number;
    retainedLogicalBytes: number;
    retainedEventCount: number;
    effectiveLimitBytes: number;
    remainingBytes: number;
    percentUsed: number;
    warning: boolean;
    warningState: string;
    limit: StorageLimit;
    measuredAt: string;
    measurementState: StorageMeasurementState;
    breakdown?: StorageUsageBreakdown;
};
/** Retained storage across every tenant. */
export type StorageUsageSummary = {
    tenantCount: number;
    attributedStorageBytes: number;
    retainedLogicalBytes: number;
    retainedEventCount: number;
    effectiveLimitBytes: number;
    remainingBytes: number;
    percentUsed: number;
    warning: boolean;
    warningState: string;
    measuredAt: string;
    measurementState: StorageMeasurementState;
    breakdown?: StorageUsageBreakdown;
    tenants: TenantStorageUsage[];
};
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class UsageAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /**
     * Return the attributed usage for the token's own tenant. The tenant is
     * derived from the credential, so the caller never supplies a company slug.
     */
    get(query?: UsageQuery, options?: RequestOptions): Promise<UsageReport>;
    /** System administrators: attributed usage across tenants, or one company's. */
    listUsage(query?: UsageAdminQuery, options?: RequestOptions): Promise<UsageReport>;
    /** System administrators: the same rows as `listUsage`, as a JSON billing export. */
    exportUsage(query?: UsageAdminQuery, options?: RequestOptions): Promise<UsageReport>;
    /** System administrators: retained storage for every tenant. */
    listStorageUsage(options?: RequestOptions): Promise<StorageUsageSummary>;
    /** The token's own tenant's retained storage. */
    getRetainedUsage(options?: RequestOptions): Promise<TenantStorageUsage>;
    private adminUsage;
}
export {};
