// UsageAdminClient reads attributed usage and retained storage. `get` reads the
// authenticated tenant's own usage through GET /api/v1/admin/usage/me; the
// tenant is derived from the credential. `listUsage` and `exportUsage` are the
// system-admin views that may name a company, and `listStorageUsage` /
// `getRetainedUsage` report retained storage against each tenant's limit.
//
// Usage is server-derived and includes provisional, final, and corrected state.
// `containsProvisional` and `containsIncomplete` are the server's own assessment
// of the returned rows, so a caller deciding whether a number is settled reads
// them rather than assuming every row is final.

import type { RequestOptions, StorageLimit, StorageMeasurementState } from "./index.js";
import {
  optionalString,
  requireBoolean,
  requireInteger,
  requireObjectList,
  requireRecord,
  requireString,
} from "./response-validation.js";

/** The row cap the service applies when a request omits a limit. */
export const USAGE_DEFAULT_LIMIT = 500;

/** The most rows the usage endpoint returns in one request. */
export const USAGE_MAX_LIMIT = 5000;

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
export type UsageAdminQuery = UsageQuery & { companySlug?: string };

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

export class UsageAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /**
   * Return the attributed usage for the token's own tenant. The tenant is
   * derived from the credential, so the caller never supplies a company slug.
   */
  get(query: UsageQuery = {}, options?: RequestOptions): Promise<UsageReport> {
    let params: string;
    try {
      params = usageQueryParams(query).toString();
    } catch (error) {
      return Promise.reject(error);
    }
    return this.request<unknown>("GET", `/usage/me${params.length > 0 ? `?${params}` : ""}`, undefined, options).then(
      assertUsageReport,
    );
  }

  /** System administrators: attributed usage across tenants, or one company's. */
  listUsage(query: UsageAdminQuery = {}, options?: RequestOptions): Promise<UsageReport> {
    return this.adminUsage("/usage", query, options);
  }

  /** System administrators: the same rows as `listUsage`, as a JSON billing export. */
  exportUsage(query: UsageAdminQuery = {}, options?: RequestOptions): Promise<UsageReport> {
    return this.adminUsage("/usage/export", query, options, { format: "json" });
  }

  /** System administrators: retained storage for every tenant. */
  async listStorageUsage(options?: RequestOptions): Promise<StorageUsageSummary> {
    const summary = await this.request<StorageUsageSummary>("GET", "/storage-usage", undefined, options);
    return { ...summary, tenants: summary.tenants ?? [] };
  }

  /** The token's own tenant's retained storage. */
  getRetainedUsage(options?: RequestOptions): Promise<TenantStorageUsage> {
    return this.request("GET", "/storage-usage/me", undefined, options);
  }

  private adminUsage(
    path: string,
    query: UsageAdminQuery,
    options?: RequestOptions,
    fixed: Record<string, string> = {},
  ): Promise<UsageReport> {
    const { companySlug, ...window } = query;
    let params: URLSearchParams;
    try {
      params = usageQueryParams(window);
    } catch (error) {
      return Promise.reject(error);
    }
    if (companySlug) params.set("companySlug", companySlug);
    for (const [name, value] of Object.entries(fixed)) params.set(name, value);
    const encoded = params.toString();
    return this.request<unknown>("GET", encoded ? `${path}?${encoded}` : path, undefined, options).then(
      assertUsageReport,
    );
  }
}

// assertUsageReport validates the named response DTO. The service emits every
// required field, so a truncated or wrongly shaped body fails here instead of
// surfacing as a zero-valued report.
function assertUsageReport(value: unknown): UsageReport {
  const context = "usage response";
  const report = requireRecord(value, context);
  requireString(report, "schemaVersion", context);
  requireString(report, "start", context);
  requireString(report, "end", context);
  requireInteger(report, "sourceWatermark", context);
  requireBoolean(report, "containsProvisional", context);
  requireBoolean(report, "containsIncomplete", context);
  optionalString(report, "companySlug", context);
  for (const [index, row] of requireObjectList(report, "rows", context).entries()) {
    const rowContext = `${context} rows[${index}]`;
    requireString(row, "accountCompanySlug", rowContext);
    requireString(row, "dataSpaceCompanySlug", rowContext);
    requireString(row, "meterSlug", rowContext);
    requireInteger(row, "meterVersion", rowContext);
    requireString(row, "unit", rowContext);
    requireString(row, "windowStart", rowContext);
    requireString(row, "windowEnd", rowContext);
    requireInteger(row, "quantity", rowContext);
    requireInteger(row, "sourceWatermark", rowContext);
    requireString(row, "completenessState", rowContext);
    requireInteger(row, "correctionGeneration", rowContext);
    requireInteger(row, "calculationVersion", rowContext);
  }
  for (const [index, total] of requireObjectList(report, "totals", context).entries()) {
    const totalContext = `${context} totals[${index}]`;
    requireString(total, "accountCompanySlug", totalContext);
    requireString(total, "dataSpaceCompanySlug", totalContext);
    requireString(total, "meterSlug", totalContext);
    requireString(total, "unit", totalContext);
    requireInteger(total, "quantity", totalContext);
  }
  return report as unknown as UsageReport;
}

// RFC3339_PATTERN is the documented usage-window grammar: a full timestamp with
// the T separator, an explicit Z or numeric offset, and captured date and clock
// components. It rejects values Date.parse accepts, such as a date-only string
// or a space-separated timestamp.
const RFC3339_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function parseInstant(value: string, field: string): number {
  const match = RFC3339_PATTERN.exec(value);
  if (match === null) {
    throw new RangeError(`custd: usage ${field} must be an RFC3339 timestamp`);
  }
  // Date.parse normalizes values that are not valid RFC3339 clock times: hour 24
  // rolls to the next day and second 60 rolls to the next minute. Bound the
  // clock components before trusting the parse, exactly as the calendar date is
  // checked below.
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59) {
    throw new RangeError(`custd: usage ${field} must be an RFC3339 timestamp`);
  }
  // Date.parse normalizes an impossible day such as February 30, so verify the
  // calendar date itself before trusting the parsed instant.
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new RangeError(`custd: usage ${field} must be an RFC3339 timestamp`);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new RangeError(`custd: usage ${field} must be an RFC3339 timestamp`);
  }
  return parsed;
}

/**
 * Build the query string and reject locally what the service would reject
 * anyway, so an invalid window never costs a round trip.
 */
function usageQueryParams(query: UsageQuery): URLSearchParams {
  if (
    query.limit !== undefined &&
    (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > USAGE_MAX_LIMIT)
  ) {
    throw new RangeError(`custd: usage limit must be between 1 and ${USAGE_MAX_LIMIT}`);
  }
  const start = query.start === undefined ? undefined : parseInstant(query.start, "start");
  const end = query.end === undefined ? undefined : parseInstant(query.end, "end");
  if (start !== undefined && end !== undefined && start >= end) {
    throw new RangeError("custd: usage start must be before end");
  }

  const params = new URLSearchParams();
  if (query.end !== undefined) {
    params.set("end", query.end);
  }
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query.meterSlug !== undefined) {
    params.set("meter", query.meterSlug);
  }
  if (query.start !== undefined) {
    params.set("start", query.start);
  }
  return params;
}
