/**
 * Admin event types and event categories: retention and rollup dimensions. An event type inherits its
 * category's retention when its own retentionDays is null. Categories are platform-wide and need a
 * system administrator.
 */
import type { RequestOptions } from "./index.js";
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
/** One rollup slot and the lookups that fill it. */
export type EventRollupDimension = {
    slot: string;
    lookups: string[];
};
export type EventRollupDimensionProfile = {
    dimensions?: EventRollupDimension[];
};
export type EventTypeConfig = {
    slug: string;
    name: string;
    categorySlug: string;
    rollupDimensions?: EventRollupDimensionProfile;
    retentionDays: number | null;
    categoryRetentionDays: number | null;
    categoryIsAudit: boolean;
};
export type EventTypeConfigListResponse = {
    eventTypes: EventTypeConfig[];
};
export type EventCategoryConfig = {
    slug: string;
    name: string;
    rollupDimensions?: EventRollupDimensionProfile;
    retentionDays: number | null;
    isAudit: boolean;
};
export type EventCategoryConfigListResponse = {
    eventCategories: EventCategoryConfig[];
};
/** retentionDays null inherits the category default. */
export type EventTypeConfigUpdateRequest = {
    retentionDays: number | null;
    rollupDimensions?: EventRollupDimensionProfile;
};
export type EventCategoryConfigUpdateRequest = {
    retentionDays: number | null;
    isAudit: boolean;
    rollupDimensions?: EventRollupDimensionProfile;
};
export declare class EventTypeAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    /** A system administrator names the tenant; a tenant administrator always reads its own. */
    list(companySlug?: string): Promise<EventTypeConfigListResponse>;
    update(slug: string, body: EventTypeConfigUpdateRequest, companySlug?: string): Promise<void>;
    listCategories(): Promise<EventCategoryConfigListResponse>;
    updateCategory(slug: string, body: EventCategoryConfigUpdateRequest): Promise<void>;
}
export {};
