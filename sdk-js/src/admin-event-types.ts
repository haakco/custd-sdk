/**
 * Admin event types and event categories: retention and rollup dimensions. An event type inherits its
 * category's retention when its own retentionDays is null. Categories are platform-wide and need a
 * system administrator.
 */

import type { RequestOptions } from "./index.js";

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

/** One rollup slot and the lookups that fill it. */
export type EventRollupDimension = { slot: string; lookups: string[] };

export type EventRollupDimensionProfile = { dimensions?: EventRollupDimension[] };

export type EventTypeConfig = {
  slug: string;
  name: string;
  categorySlug: string;
  rollupDimensions?: EventRollupDimensionProfile;
  retentionDays: number | null;
  categoryRetentionDays: number | null;
  categoryIsAudit: boolean;
};

export type EventTypeConfigListResponse = { eventTypes: EventTypeConfig[] };

export type EventCategoryConfig = {
  slug: string;
  name: string;
  rollupDimensions?: EventRollupDimensionProfile;
  retentionDays: number | null;
  isAudit: boolean;
};

export type EventCategoryConfigListResponse = { eventCategories: EventCategoryConfig[] };

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

export class EventTypeAdminClient {
  constructor(private readonly request: AdminRequester) {}

  /** A system administrator names the tenant; a tenant administrator always reads its own. */
  async list(companySlug?: string): Promise<EventTypeConfigListResponse> {
    const response = await this.request<{ eventTypes: EventTypeConfig[] | null }>(
      "GET",
      scoped("/event-types", companySlug),
    );
    return { eventTypes: response.eventTypes ?? [] };
  }

  update(slug: string, body: EventTypeConfigUpdateRequest, companySlug?: string): Promise<void> {
    return this.request("PATCH", scoped(`/event-types/${encodeURIComponent(slug)}`, companySlug), body);
  }

  async listCategories(): Promise<EventCategoryConfigListResponse> {
    const response = await this.request<{ eventCategories: EventCategoryConfig[] | null }>("GET", "/event-categories");
    return { eventCategories: response.eventCategories ?? [] };
  }

  updateCategory(slug: string, body: EventCategoryConfigUpdateRequest): Promise<void> {
    return this.request("PATCH", `/event-categories/${encodeURIComponent(slug)}`, body);
  }
}

function scoped(path: string, companySlug?: string): string {
  return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
