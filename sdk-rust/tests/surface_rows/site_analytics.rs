use custd_sdk::{
    SiteAIConsentRequest, SiteAISettings, SiteAISettingsRequest, SiteAITenantUsage,
    SiteAIVisibility, SiteAnalyticsConnection, SiteAnalyticsConnectionRequest, SiteAnalyticsReport,
    SiteTraffic,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/analytics",
            "/api/v1/site-domains/d-1/analytics?companySlug=acme",
            |c| drop(c.custd.get_site_analytics("d-1", Some("acme"))),
            round_trip::<SiteAnalyticsReport>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/analytics/ga4",
            "/api/v1/site-domains/d-1/analytics/ga4?companySlug=acme",
            |c| {
                drop(c.custd.connect_site_analytics(
                    "d-1",
                    &body::<SiteAnalyticsConnectionRequest>(r#"{"propertyId":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteAnalyticsConnection>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/analytics/ga4",
            "/api/v1/site-domains/d-1/analytics/ga4?companySlug=acme",
            |c| drop(c.custd.disconnect_site_analytics("d-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/traffic",
            "/api/v1/site-domains/d-1/traffic?from=f-1&to=t-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_traffic("d-1", Some("f-1"), Some("t-1"), Some("acme")),
                )
            },
            round_trip::<SiteTraffic>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/ai-visibility",
            "/api/v1/site-domains/d-1/ai-visibility?from=f-1&to=t-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_ai_visibility("d-1", Some("f-1"), Some("t-1"), Some("acme")),
                )
            },
            round_trip::<SiteAIVisibility>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/ai-settings",
            "/api/v1/site-domains/ai-settings",
            |c| drop(c.custd.get_site_ai_settings()),
            round_trip::<SiteAISettings>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/ai-usage",
            "/api/v1/site-domains/ai-usage",
            |c| drop(c.custd.get_site_ai_tenant_usage()),
            round_trip::<SiteAITenantUsage>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/ai-settings",
            "/api/v1/site-domains/ai-settings",
            |c| {
                drop(c.custd.set_site_ai_settings(&body::<SiteAISettingsRequest>(
                    r#"{"aiMode":"off","monthlyCapUsdMicros":1}"#,
                )))
            },
            round_trip::<SiteAISettings>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/ai-settings/consent",
            "/api/v1/site-domains/ai-settings/consent",
            |c| {
                drop(
                    c.custd.set_site_ai_consent(&body::<SiteAIConsentRequest>(
                        r#"{"action":"grant"}"#,
                    )),
                )
            },
            round_trip::<SiteAISettings>,
        ),
    ]
}
