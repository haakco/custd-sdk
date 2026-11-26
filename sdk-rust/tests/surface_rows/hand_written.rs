//! Rows for the hand-written methods: non-JSON bodies and the routes that take no bearer token.

use custd_sdk::{
    AppAlertUnsubscribeRequest, AuthDomainMonitoringInventory, AuthProjectAppUploadedFile,
    AuthProjectBrandLogo, CurrentApplicationProfile, HostedAppDiscovery, ImageFile,
    ReportExportDownload, SiteConfigResponse, SiteReport, get_app_alert_unsubscribe_page,
    get_site_config, read_app_host_discovery, read_auth_domain_monitoring_inventory,
    read_shared_site_report, unsubscribe_app_alert_email,
};

use super::round_trip;
use crate::{Row, bodiless, row, shape};

fn png() -> ImageFile {
    ImageFile {
        content_type: "image/png".to_owned(),
        bytes: b"png".to_vec(),
    }
}

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/brand/logo",
            |c| drop(c.custd.set_auth_project_brand_logo("p-1", "e-1", &png())),
            round_trip::<AuthProjectBrandLogo>,
        ),
        row(
            "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/files",
            "/api/v1/admin/auth-projects/p-1/environments/e-1/releases/r-1/files?path=assets%2Findex.js",
            |c| {
                drop(c.custd.upload_auth_project_app_release_file(
                    "p-1",
                    "e-1",
                    "r-1",
                    "assets/index.js",
                    b"x",
                ))
            },
            round_trip::<AuthProjectAppUploadedFile>,
        ),
        bodiless(
            "analytics-api GET /api/v1/reporting/exports/{exportID}/artifacts/{artifactID}",
            "/api/v1/reporting/exports/e-1/artifacts/a-1",
            |c| {
                drop::<Result<ReportExportDownload, _>>(
                    c.custd.download_report_export("e-1", "a-1"),
                )
            },
        ),
        bodiless(
            "admin-api GET /api/v1/app/profile/photo",
            "/api/v1/app/profile/photo",
            |c| drop(c.custd.get_current_app_profile_photo()),
        ),
        row(
            "admin-api PUT /api/v1/app/profile/photo",
            "/api/v1/app/profile/photo",
            |c| drop(c.custd.update_current_app_profile_photo(&png())),
            round_trip::<CurrentApplicationProfile>,
        ),
        row(
            "admin-api POST /api/v1/app/profile/photo",
            "/api/v1/app/profile/photo",
            |c| drop(c.custd.initialize_current_app_profile_photo(&png())),
            round_trip::<CurrentApplicationProfile>,
        ),
        row(
            "admin-api GET /api/v1/sites/{siteUuid}/config",
            "/api/v1/sites/s-1/config",
            |c| drop(get_site_config(&c.base_url, "s-1")),
            round_trip::<SiteConfigResponse>,
        ),
        row(
            "admin-api GET /api/v1/shared-site-reports/{token}",
            "/api/v1/shared-site-reports/t-1",
            |c| drop(read_shared_site_report(&c.base_url, "t-1")),
            round_trip::<SiteReport>,
        ),
        row(
            "admin-api GET /api/v1/app-hosts/{host}/discovery",
            "/api/v1/app-hosts/counter.apps.custd.com/discovery",
            |c| {
                drop(read_app_host_discovery(
                    &c.base_url,
                    "counter.apps.custd.com",
                ))
            },
            shape::<HostedAppDiscovery>,
        ),
        row(
            "admin-api GET /api/v1/auth-domain-monitoring/inventory",
            "/api/v1/auth-domain-monitoring/inventory",
            |c| drop(read_auth_domain_monitoring_inventory(&c.base_url, "k-1")),
            round_trip::<AuthDomainMonitoringInventory>,
        ),
        bodiless(
            "admin-api GET /api/v1/app/item/alerts/unsubscribe",
            "/api/v1/app/item/alerts/unsubscribe?token=t-1",
            |c| drop(get_app_alert_unsubscribe_page(&c.base_url, Some("t-1"))),
        ),
        bodiless(
            "admin-api POST /api/v1/app/item/alerts/unsubscribe",
            "/api/v1/app/item/alerts/unsubscribe",
            |c| {
                let request = AppAlertUnsubscribeRequest {
                    token: "t-1".to_owned(),
                };
                drop(unsubscribe_app_alert_email(&c.base_url, &request));
            },
        ),
    ]
}
