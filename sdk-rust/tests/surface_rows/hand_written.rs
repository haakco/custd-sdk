//! Rows for the hand-written methods: non-JSON bodies, the routes that take no bearer token and the
//! reports a site monitor sends with its own write token.

use custd_sdk::{
    AppAlertUnsubscribeRequest, AuthDomainMonitoringInventory, AuthProjectAppUploadedFile,
    AuthProjectBrandLogo, CurrentApplicationProfile, HostedAppDiscovery, ImageFile,
    ReportExportDownload, SiteConfigResponse, SiteHeartbeatReport, SiteHeartbeatReportOutcome,
    SiteMonitorDestination, SitePrivateUptimeReport, SiteReport, SiteStatusSubscriptionRequest,
    SiteStatusSubscriptionToken, confirm_status_page_subscription, get_app_alert_unsubscribe_page,
    get_private_uptime_work, get_site_config, read_app_host_discovery,
    read_auth_domain_monitoring_inventory, read_public_status_page, read_shared_site_report,
    submit_private_uptime, submit_site_heartbeat, subscribe_to_status_page,
    unsubscribe_app_alert_email, unsubscribe_from_status_page,
};

use super::round_trip;
use crate::{Clients, Row, bodiless, row, shape};

fn monitor(c: &Clients, kind: &str) -> SiteMonitorDestination {
    SiteMonitorDestination {
        base_url: c.base_url.clone(),
        report_path: format!("/api/v1/{kind}/acme/m-1"),
        write_token: "w".repeat(64),
    }
}

fn token() -> SiteStatusSubscriptionToken {
    SiteStatusSubscriptionToken {
        token: "t-1".to_owned(),
    }
}

/// The public status page and its subscription routes, and the site monitor reports.
fn status_page_and_monitor_rows() -> Vec<Row> {
    vec![
        bodiless(
            "admin-api GET /api/v1/public-status-pages/{key}",
            "/api/v1/public-status-pages/k-1",
            |c| drop(read_public_status_page(&c.base_url, "k-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/public-status-pages/{key}/subscribe",
            "/api/v1/public-status-pages/k-1/subscribe",
            |c| {
                let request = SiteStatusSubscriptionRequest {
                    email: "a@example.com".to_owned(),
                };
                drop(subscribe_to_status_page(&c.base_url, "k-1", &request))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/public-status-pages/{key}/confirm-subscription",
            "/api/v1/public-status-pages/k-1/confirm-subscription",
            |c| {
                drop(confirm_status_page_subscription(
                    &c.base_url,
                    "k-1",
                    &token(),
                ))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/public-status-pages/{key}/unsubscribe",
            "/api/v1/public-status-pages/k-1/unsubscribe",
            |c| drop(unsubscribe_from_status_page(&c.base_url, "k-1", &token())),
        ),
        bodiless(
            "admin-api POST /api/v1/site-heartbeat-reports/{companySlug}/{monitorUuid}",
            "/api/v1/site-heartbeat-reports/acme/m-1",
            |c| {
                let report = SiteHeartbeatReport {
                    outcome: SiteHeartbeatReportOutcome::Succeeded,
                    scheduled_for: "2026-11-20T06:00:00Z".to_owned(),
                };
                drop(submit_site_heartbeat(
                    &monitor(c, "site-heartbeat-reports"),
                    &report,
                ))
            },
        ),
        bodiless(
            "admin-api POST /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}",
            "/api/v1/site-private-uptime-reports/acme/m-1",
            |c| {
                let report = SitePrivateUptimeReport {
                    failure: None,
                    observed_at: "2026-11-20T06:00:00Z".to_owned(),
                    report_uuid: "r-1".to_owned(),
                    response_ms: 12,
                    status_code: Some(200),
                };
                let destination = monitor(c, "site-private-uptime-reports");
                drop(submit_private_uptime(&destination, &report))
            },
        ),
        bodiless(
            "admin-api GET /api/v1/site-private-uptime-reports/{companySlug}/{monitorUuid}",
            "/api/v1/site-private-uptime-reports/acme/m-1",
            |c| {
                drop(get_private_uptime_work(&monitor(
                    c,
                    "site-private-uptime-reports",
                )))
            },
        ),
    ]
}

fn png() -> ImageFile {
    ImageFile {
        content_type: "image/png".to_owned(),
        bytes: b"png".to_vec(),
    }
}

pub fn rows() -> Vec<Row> {
    let mut rows = status_page_and_monitor_rows();
    rows.extend([
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
    ]);
    rows
}
