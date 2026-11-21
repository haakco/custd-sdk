// Everything Site Insights holds for one domain and its Site, as the tenant's
// own typed reads return it. Daily search metrics are paged separately.
// SiteDomainAdminClient sends the calls.
/** The schema an export names; a different value is a different shape. */
export const SITE_INSIGHTS_EXPORT_SCHEMA = "custd.site-insights-export.v1";
/** The most search metric rows one listExportSearchMetrics page returns. */
export const SITE_INSIGHTS_EXPORT_SEARCH_METRICS_MAX_LIMIT = 10000;
/** The search metric dimension a row is cut by; newer values may appear. */
export const SiteSearchMetricDimension = {
    Total: "total",
    Page: "page",
    Query: "query",
    Country: "country",
    Device: "device",
};
