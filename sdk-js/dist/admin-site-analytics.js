// A domain's GA4 reports: landing pages, key events and channels imported from
// the domain's GA4 property. SiteDomainAdminClient sends the calls. A number
// GA4 did not report is absent, never 0.
/** A 400 on connectAnalytics: propertyId is not a GA4 property's numeric ID. */
export const SITE_ANALYTICS_PROPERTY_INVALID_CODE = "site_analytics_property_invalid";
/** A 404 on disconnectAnalytics: the domain is not connected to GA4. */
export const SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE = "site_analytics_connection_not_found";
/** The analytics provider a connection reads. */
export const SITE_ANALYTICS_PROVIDER_GA4 = "ga4";
/** A GA4 report Custd does not import, as SiteAnalyticsReport.unavailable names it; newer values may appear. */
export const SiteAnalyticsUnavailableReport = {
    Ecommerce: "ecommerce",
    Audience: "audience",
};
