use custd_sdk::{
    SiteAlertDestination, SiteAlertDestinationRequest, SiteDomainWithUptimePath,
    SiteHeartbeatCreate, SiteHeartbeatCredential, SiteHeartbeatList, SiteIncident,
    SiteIncidentListResponse, SiteMaintenanceWindow, SiteMaintenanceWindowRequest,
    SiteMaintenanceWindows, SitePrivateUptimeCredential, SitePrivateUptimeMonitor,
    SitePrivateUptimeMonitorCreate, SitePrivateUptimeWork, SiteProbeListResponse,
    SiteProbesRequest, SiteUptimeHistory,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/incidents",
            "/api/v1/site-domains/d-1/incidents?companySlug=acme",
            |c| drop(c.custd.list_site_incidents("d-1", Some("acme"))),
            round_trip::<SiteIncidentListResponse>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/incidents/{incidentUuid}/acknowledgment",
            "/api/v1/site-domains/d-1/incidents/i-1/acknowledgment?companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .acknowledge_site_incident("i-1", "d-1", Some("acme")),
                )
            },
            round_trip::<SiteIncident>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/uptime-check",
            "/api/v1/site-domains/d-1/uptime-check?companySlug=acme",
            |c| drop(c.custd.request_site_uptime_check("d-1", Some("acme"))),
            round_trip::<SiteDomainWithUptimePath>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats",
            "/api/v1/site-domains/d-1/heartbeats?companySlug=acme",
            |c| drop(c.custd.list_site_heartbeats("d-1", Some("acme"))),
            round_trip::<SiteHeartbeatList>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats",
            "/api/v1/site-domains/d-1/heartbeats?companySlug=acme",
            |c| {
                drop(c.custd.create_site_heartbeat(
                    "d-1",
                    &body::<SiteHeartbeatCreate>(
                        r#"{"name":"x","schedule":{"cron":"x","graceMinutes":1,"timezone":"x"}}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SiteHeartbeatCredential>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}/credential",
            "/api/v1/site-domains/d-1/heartbeats/m-1/credential?companySlug=acme",
            |c| drop(c.custd.rotate_site_heartbeat("m-1", "d-1", Some("acme"))),
            round_trip::<SiteHeartbeatCredential>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}",
            "/api/v1/site-domains/d-1/heartbeats/m-1?companySlug=acme",
            |c| drop(c.custd.delete_site_heartbeat("m-1", "d-1", Some("acme"))),
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/private-uptime",
            "/api/v1/site-domains/d-1/private-uptime?companySlug=acme",
            |c| drop(c.custd.get_private_uptime("d-1", Some("acme"))),
            round_trip::<SitePrivateUptimeMonitor>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime",
            "/api/v1/site-domains/d-1/private-uptime?companySlug=acme",
            |c| {
                drop(c.custd.create_private_uptime(
                    "d-1",
                    &body::<SitePrivateUptimeMonitorCreate>(r#"{"networkLabel":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SitePrivateUptimeCredential>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}/credential",
            "/api/v1/site-domains/d-1/private-uptime/m-1/credential?companySlug=acme",
            |c| drop(c.custd.rotate_private_uptime("m-1", "d-1", Some("acme"))),
            round_trip::<SitePrivateUptimeCredential>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}",
            "/api/v1/site-domains/d-1/private-uptime/m-1?companySlug=acme",
            |c| drop(c.custd.delete_private_uptime("m-1", "d-1", Some("acme"))),
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/check",
            "/api/v1/site-domains/d-1/private-uptime/check?companySlug=acme",
            |c| drop(c.custd.request_private_uptime("d-1", Some("acme"))),
            round_trip::<SitePrivateUptimeWork>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/maintenance",
            "/api/v1/site-domains/d-1/maintenance?companySlug=acme",
            |c| drop(c.custd.list_site_maintenance("d-1", Some("acme"))),
            round_trip::<SiteMaintenanceWindows>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/maintenance",
            "/api/v1/site-domains/d-1/maintenance?companySlug=acme",
            |c| {
                drop(c.custd.schedule_site_maintenance(
                    "d-1",
                    &body::<SiteMaintenanceWindowRequest>(
                        r#"{"endsAt":"x","startsAt":"x","windowUuid":"x"}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<SiteMaintenanceWindow>,
        ),
        row(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/maintenance/{windowUuid}",
            "/api/v1/site-domains/d-1/maintenance/w-1?companySlug=acme",
            |c| drop(c.custd.cancel_site_maintenance("d-1", "w-1", Some("acme"))),
            round_trip::<SiteMaintenanceWindow>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/probes",
            "/api/v1/site-domains/d-1/probes?companySlug=acme",
            |c| drop(c.custd.list_site_probes("d-1", Some("acme"))),
            round_trip::<SiteProbeListResponse>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/probes",
            "/api/v1/site-domains/d-1/probes?companySlug=acme",
            |c| {
                drop(c.custd.set_site_probes(
                    "d-1",
                    &body::<SiteProbesRequest>(r#"{"probes":[]}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteProbeListResponse>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/uptime-history",
            "/api/v1/site-domains/d-1/uptime-history?responseDays=7&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_uptime_history("d-1", Some(7), Some("acme")),
                )
            },
            round_trip::<SiteUptimeHistory>,
        ),
        row(
            "admin-api GET /api/v1/site-domains/alert-destination",
            "/api/v1/site-domains/alert-destination?siteUuid=s-1&companySlug=acme",
            |c| {
                drop(
                    c.custd
                        .get_site_alert_destination(Some("s-1"), Some("acme")),
                )
            },
            round_trip::<SiteAlertDestination>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/alert-destination",
            "/api/v1/site-domains/alert-destination?siteUuid=s-1&companySlug=acme",
            |c| {
                drop(c.custd.set_site_alert_destination(
                    Some("s-1"),
                    &body::<SiteAlertDestinationRequest>(r#"{"emailRecipient":"x"}"#),
                    Some("acme"),
                ))
            },
            round_trip::<SiteAlertDestination>,
        ),
    ]
}
