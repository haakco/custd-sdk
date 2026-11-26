// A domain's GA4 reports: landing pages, key events and channels imported from
// the domain's GA4 property. SiteDomainAdminClient sends the calls. A number
// GA4 did not report is absent, never 0.

import type { SiteSearchConnectionStatus } from "./admin-site-domains.js";

/** A 400 on connectAnalytics: propertyId is not a GA4 property's numeric ID. */
export const SITE_ANALYTICS_PROPERTY_INVALID_CODE = "site_analytics_property_invalid";
/** A 404 on disconnectAnalytics: the domain is not connected to GA4. */
export const SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE = "site_analytics_connection_not_found";

/** The analytics provider a connection reads. */
export const SITE_ANALYTICS_PROVIDER_GA4 = "ga4";

/** A GA4 report Custd does not import, as SiteAnalyticsReport.unavailable names it. */
export const SiteAnalyticsUnavailableReport = {
  Ecommerce: "ecommerce",
  Audience: "audience",
} as const;

export type SiteAnalyticsUnavailableReport =
  (typeof SiteAnalyticsUnavailableReport)[keyof typeof SiteAnalyticsUnavailableReport];

/** The GA4 property: 123456789 or properties/123456789. */
export type SiteAnalyticsConnectionRequest = {
  propertyId: string;
};

export type SiteAnalyticsConnection = {
  /** SITE_ANALYTICS_PROVIDER_GA4. */
  provider: "ga4";
  propertyId: string;
  status: SiteSearchConnectionStatus;
  lastImportedAt?: string;
  lastFailure?: string;
};

/** One landing page, key event or channel. */
export type SiteAnalyticsRow = {
  key: string;
  sessions?: number;
  engagedSessions?: number;
  keyEvents?: number;
};

export type SiteAnalyticsUnavailable = {
  /** A SiteAnalyticsUnavailableReport value. */
  report: SiteAnalyticsUnavailableReport;
  reason: string;
};

/** connection, windowFrom and windowTo are absent until the domain is connected and imported. */
export type SiteAnalyticsReport = {
  domainUuid: string;
  connection?: SiteAnalyticsConnection;
  /** YYYY-MM-DD. */
  windowFrom?: string;
  /** YYYY-MM-DD. */
  windowTo?: string;
  /** false while the property records no key events, so rows carry no keyEvents. */
  keyEventsRecorded: boolean;
  landingPages: SiteAnalyticsRow[];
  keyEvents: SiteAnalyticsRow[];
  channels: SiteAnalyticsRow[];
  unavailable: SiteAnalyticsUnavailable[];
};
