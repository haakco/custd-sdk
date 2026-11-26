//! Route and response-shape conformance against the Custd operation snapshot.
//!
//! Each row calls one public SDK method through the fake server and names the snapshot operation
//! it implements. The test proves the method and path the SDK sends, decodes the operation's
//! minimal and maximal example responses into the method's response type, and keeps
//! `contract-fixtures/api/coverage/rust.json` equal to the rows.

mod support;
mod surface_rows;

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use custd_sdk::{
    AppAlertDeliveryList, AppAlertRule, AppAlertRuleSpec, AppAlertSettings, AppAlertSubscription,
    AppAlertWebhook, AppAlertWebhookCreated, AppClient, AppForecastStory, AppItemCreate,
    AppItemCreated, AppItemLinkRotated, AppItemList, AppItemRead, AppLinkCollectionEntry,
    AppMeetingMinutes, AppMeetingMinutesUpdate, AppModelRun, AppModelRunRequest, AppPlanForecast,
    AppPlanUpdate, AppReadOptions, CustdClient, MeasurementForecastRun,
    MeasurementForecastRunRequest, MeasurementObservationBulk, MeasurementObservationImport,
    MeasurementProject, MeasurementProjectCreate, MeasurementProjectList, MeasurementTargetCreate,
    ProjectComplete, ProjectEstimate, ProjectEstimateCreate, ProjectEstimateList, SDK_IDENTITY,
    SiteStatusDraft, SiteStatusPage, SiteStatusPublication, SiteStatusSettings,
    SiteStatusUpdateHistory, SiteStatusUpdateRequest,
};
use serde::de::DeserializeOwned;
use serde_json::Value;
use support::{FakeServer, answer};

struct Clients {
    custd: CustdClient,
    app: AppClient,
    /// The fake server's origin, for the routes that take no bearer token.
    base_url: String,
}

type Decode = fn(&Value) -> Result<(), serde_json::Error>;

struct Row {
    id: &'static str,
    path: &'static str,
    call: fn(&Clients),
    decode: Option<Decode>,
    /// The method the SDK sends for an `ANY` operation; otherwise the id's method.
    method: Option<&'static str>,
}

fn shape<T: DeserializeOwned>(value: &Value) -> Result<(), serde_json::Error> {
    T::deserialize(value).map(|_| ())
}

const fn row(id: &'static str, path: &'static str, call: fn(&Clients), decode: Decode) -> Row {
    Row {
        id,
        path,
        call,
        decode: Some(decode),
        method: None,
    }
}

const fn bodiless(id: &'static str, path: &'static str, call: fn(&Clients)) -> Row {
    Row {
        id,
        path,
        call,
        decode: None,
        method: None,
    }
}

/// A row for an `ANY` operation: the SDK must send `method`.
const fn sends(method: &'static str, row: Row) -> Row {
    Row {
        method: Some(method),
        ..row
    }
}

const TOKEN: &str = "tok-1";

fn read() -> AppReadOptions {
    AppReadOptions::default()
}

fn project_create() -> MeasurementProjectCreate {
    MeasurementProjectCreate {
        project_code: "launch".to_owned(),
        name: "Launch".to_owned(),
        kind: "deadline_forecast".to_owned(),
        description: None,
        series: vec![],
        target: MeasurementTargetCreate {
            target_code: "all".to_owned(),
            name: "All".to_owned(),
            target_value: 10.0,
            target_date: None,
            state: "active".to_owned(),
        },
    }
}

fn estimate() -> ProjectEstimateCreate {
    ProjectEstimateCreate {
        estimated_at: None,
        low_date: "2026-12-01".to_owned(),
        high_date: "2026-12-10".to_owned(),
        note: None,
    }
}

fn complete() -> ProjectComplete {
    ProjectComplete {
        completed_at: "2026-12-05T00:00:00Z".to_owned(),
    }
}

fn no_rows() -> MeasurementObservationBulk {
    MeasurementObservationBulk { rows: vec![] }
}

fn draft() -> SiteStatusDraft {
    SiteStatusDraft {
        title: "Status".to_owned(),
        components: vec![],
    }
}

fn rule() -> AppAlertRuleSpec {
    AppAlertRuleSpec {
        rule_type: "target_reached".to_owned(),
        threshold: None,
        stale_days: None,
    }
}

fn app_rows() -> Vec<Row> {
    vec![
        row(
            "admin-api POST /api/v1/app/items",
            "/api/v1/app/items",
            |c| drop(c.app.create_item(&AppItemCreate::default())),
            shape::<AppItemCreated>,
        ),
        row(
            "admin-api GET /api/v1/app/items",
            "/api/v1/app/items",
            |c| drop(c.app.list_my_items()),
            shape::<AppItemList>,
        ),
        row(
            "admin-api GET /api/v1/app/item",
            "/api/v1/app/item",
            |c| drop(c.app.link(TOKEN).read(&read())),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/claim",
            "/api/v1/app/item/claim",
            |c| drop(c.app.link(TOKEN).claim()),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api GET /api/v1/app/item/plan/forecast",
            "/api/v1/app/item/plan/forecast",
            |c| drop(c.app.link(TOKEN).plan_forecast()),
            shape::<AppPlanForecast>,
        ),
        row(
            "admin-api PATCH /api/v1/app/item/plan",
            "/api/v1/app/item/plan",
            |c| {
                let update = AppPlanUpdate {
                    expected_revision: 1,
                    deadline: None,
                    parts: vec![],
                };
                drop(c.app.link(TOKEN).update_plan(&update));
            },
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/measurements",
            "/api/v1/app/item/measurements",
            |c| drop(c.app.link(TOKEN).add_measurements(&no_rows())),
            shape::<MeasurementObservationImport>,
        ),
        row(
            "admin-api POST /api/v1/app/item/measurements/csv",
            "/api/v1/app/item/measurements/csv",
            |c| drop(c.app.link(TOKEN).import_measurements_csv("a\n", 0)),
            shape::<MeasurementObservationImport>,
        ),
        row(
            "admin-api POST /api/v1/app/item/estimates",
            "/api/v1/app/item/estimates",
            |c| drop(c.app.link(TOKEN).create_estimate(&estimate())),
            shape::<ProjectEstimate>,
        ),
        row(
            "admin-api POST /api/v1/app/item/complete",
            "/api/v1/app/item/complete",
            |c| drop(c.app.link(TOKEN).complete(&complete())),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/cancel",
            "/api/v1/app/item/cancel",
            |c| drop(c.app.link(TOKEN).cancel()),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/reopen",
            "/api/v1/app/item/reopen",
            |c| drop(c.app.link(TOKEN).reopen()),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/entries",
            "/api/v1/app/item/entries",
            |c| drop(c.app.link(TOKEN).add_entry("tok-2")),
            shape::<AppLinkCollectionEntry>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/app/item/entries/{entryUuid}",
            "/api/v1/app/item/entries/e-1",
            |c| drop(c.app.link(TOKEN).remove_entry("e-1")),
        ),
        bodiless(
            "admin-api DELETE /api/v1/app/item/links/{linkUuid}",
            "/api/v1/app/item/links/l-1",
            |c| drop(c.app.link(TOKEN).revoke_link("l-1")),
        ),
        row(
            "admin-api POST /api/v1/app/item/links/{linkUuid}/rotate",
            "/api/v1/app/item/links/l-1/rotate",
            |c| drop(c.app.link(TOKEN).rotate_link("l-1")),
            shape::<AppItemLinkRotated>,
        ),
        row(
            "analytics-api POST /api/v1/app/forecast/runs",
            "/api/v1/app/forecast/runs",
            |c| {
                let request = MeasurementForecastRunRequest::default();
                drop(c.app.link(TOKEN).run_forecast(&request));
            },
            shape::<MeasurementForecastRun>,
        ),
        row(
            "analytics-api GET /api/v1/app/forecast/story",
            "/api/v1/app/forecast/story",
            |c| drop(c.app.link(TOKEN).forecast_story(&read())),
            shape::<AppForecastStory>,
        ),
        row(
            "analytics-api GET /api/v1/app/forecast/latest",
            "/api/v1/app/forecast/latest",
            |c| drop(c.app.link(TOKEN).latest_forecast(&read())),
            shape::<MeasurementForecastRun>,
        ),
        row(
            "analytics-api GET /api/v1/app/forecast/runs/{runUuid}",
            "/api/v1/app/forecast/runs/r-1",
            |c| drop(c.app.link(TOKEN).forecast_run("r-1", &read())),
            shape::<MeasurementForecastRun>,
        ),
        row(
            "analytics-api POST /api/v1/app/models/runs",
            "/api/v1/app/models/runs",
            |c| {
                let request = AppModelRunRequest {
                    seed: 1,
                    sample_count: None,
                    sensitivity_output: None,
                };
                drop(c.app.link(TOKEN).run_model(&request));
            },
            shape::<AppModelRun>,
        ),
        row(
            "analytics-api GET /api/v1/app/models/latest",
            "/api/v1/app/models/latest",
            |c| drop(c.app.link(TOKEN).latest_model_run(&read())),
            shape::<AppModelRun>,
        ),
    ]
}

fn app_alert_and_meeting_rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/app/item/alerts",
            "/api/v1/app/item/alerts",
            |c| drop(c.app.link(TOKEN).alert_settings()),
            shape::<AppAlertSettings>,
        ),
        row(
            "admin-api GET /api/v1/app/item/alerts/deliveries",
            "/api/v1/app/item/alerts/deliveries",
            |c| drop(c.app.link(TOKEN).alert_deliveries()),
            shape::<AppAlertDeliveryList>,
        ),
        row(
            "admin-api POST /api/v1/app/item/alerts/rules",
            "/api/v1/app/item/alerts/rules",
            |c| drop(c.app.link(TOKEN).add_alert_rule(&rule())),
            shape::<AppAlertRule>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/app/item/alerts/rules/{ruleUuid}",
            "/api/v1/app/item/alerts/rules/r-1",
            |c| drop(c.app.link(TOKEN).remove_alert_rule("r-1")),
        ),
        row(
            "admin-api POST /api/v1/app/item/alerts/webhooks",
            "/api/v1/app/item/alerts/webhooks",
            |c| drop(c.app.link(TOKEN).add_alert_webhook("https://hooks.example")),
            shape::<AppAlertWebhookCreated>,
        ),
        row(
            "admin-api POST /api/v1/app/item/alerts/slack",
            "/api/v1/app/item/alerts/slack",
            |c| {
                drop(
                    c.app
                        .link(TOKEN)
                        .add_alert_slack("https://hooks.slack.com/x"),
                )
            },
            shape::<AppAlertWebhook>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/app/item/alerts/webhooks/{webhookUuid}",
            "/api/v1/app/item/alerts/webhooks/w-1",
            |c| drop(c.app.link(TOKEN).remove_alert_webhook("w-1")),
        ),
        row(
            "admin-api PUT /api/v1/app/item/alerts/subscription",
            "/api/v1/app/item/alerts/subscription",
            |c| drop(c.app.link(TOKEN).subscribe_alert_email()),
            shape::<AppAlertSubscription>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/app/item/alerts/subscription",
            "/api/v1/app/item/alerts/subscription",
            |c| drop(c.app.link(TOKEN).unsubscribe_alert_email()),
        ),
        row(
            "admin-api PATCH /api/v1/app/item/meeting/minutes",
            "/api/v1/app/item/meeting/minutes",
            |c| {
                let update = AppMeetingMinutesUpdate {
                    minutes: AppMeetingMinutes {
                        plan_uuid: None,
                        minutes: String::new(),
                        decisions: String::new(),
                        shared_summary: None,
                        actions: vec![],
                    },
                    expected_revision: 1,
                    plan_link_token: None,
                };
                drop(c.app.link(TOKEN).update_meeting_minutes(&update));
            },
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/meeting/start",
            "/api/v1/app/item/meeting/start",
            |c| drop(c.app.link(TOKEN).start_meeting()),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/meeting/advance",
            "/api/v1/app/item/meeting/advance",
            |c| drop(c.app.link(TOKEN).advance_meeting("b-1")),
            shape::<AppItemRead>,
        ),
        row(
            "admin-api POST /api/v1/app/item/meeting/end",
            "/api/v1/app/item/meeting/end",
            |c| drop(c.app.link(TOKEN).end_meeting()),
            shape::<AppItemRead>,
        ),
    ]
}

const PROJECTS: &str = "/api/v1/admin/measurement/projects";

fn measurement_rows() -> Vec<Row> {
    vec![
        row(
            "admin-api POST /api/v1/admin/measurement/projects",
            PROJECTS,
            |c| drop(c.custd.create_measurement_project(&project_create())),
            shape::<MeasurementProject>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects",
            PROJECTS,
            |c| drop(c.custd.list_measurement_projects()),
            shape::<MeasurementProjectList>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}",
            "/api/v1/admin/measurement/projects/p-1",
            |c| drop(c.custd.get_measurement_project("p-1")),
            shape::<MeasurementProject>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk",
            "/api/v1/admin/measurement/projects/p-1/observations:bulk",
            |c| drop(c.custd.add_measurement_observations("p-1", &no_rows())),
            shape::<MeasurementObservationImport>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv",
            "/api/v1/admin/measurement/projects/p-1/observations:csv",
            |c| drop(c.custd.import_measurement_observations_csv("p-1", "a\n", 0)),
            shape::<MeasurementObservationImport>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/estimates",
            "/api/v1/admin/measurement/projects/p-1/estimates",
            |c| drop(c.custd.create_project_estimate("p-1", &estimate())),
            shape::<ProjectEstimate>,
        ),
        row(
            "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/estimates",
            "/api/v1/admin/measurement/projects/p-1/estimates",
            |c| drop(c.custd.list_project_estimates("p-1")),
            shape::<ProjectEstimateList>,
        ),
        row(
            "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/complete",
            "/api/v1/admin/measurement/projects/p-1/complete",
            |c| drop(c.custd.complete_project("p-1", &complete())),
            shape::<MeasurementProject>,
        ),
        row(
            "analytics-api POST /api/v1/measurement/projects/{projectUuid}/forecast-runs",
            "/api/v1/measurement/projects/p-1/forecast-runs",
            |c| {
                let request = MeasurementForecastRunRequest::default();
                drop(c.custd.run_measurement_forecast("p-1", &request));
            },
            shape::<MeasurementForecastRun>,
        ),
        row(
            "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-runs/{runUuid}",
            "/api/v1/measurement/projects/p-1/forecast-runs/r-1",
            |c| drop(c.custd.get_measurement_forecast_run("p-1", "r-1")),
            shape::<MeasurementForecastRun>,
        ),
    ]
}

const STATUS_PAGE: &str = "/api/v1/site-domains/d-1/status-page";

fn status_page_rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/site-domains/{domainUuid}/status-page",
            "/api/v1/site-domains/d-1/status-page?companySlug=acme",
            |c| drop(c.custd.get_status_page_settings("d-1", Some("acme"))),
            shape::<SiteStatusSettings>,
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/preview",
            "/api/v1/site-domains/d-1/status-page/preview",
            |c| drop(c.custd.preview_status_page("d-1", &draft(), None)),
            shape::<SiteStatusPage>,
        ),
        row(
            "admin-api PUT /api/v1/site-domains/{domainUuid}/status-page",
            STATUS_PAGE,
            |c| drop(c.custd.publish_status_page("d-1", &draft(), None)),
            shape::<SiteStatusPublication>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/site-domains/{domainUuid}/status-page",
            STATUS_PAGE,
            |c| drop(c.custd.unpublish_status_page("d-1", None)),
        ),
        row(
            "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/updates",
            "/api/v1/site-domains/d-1/status-page/updates",
            |c| {
                let request = SiteStatusUpdateRequest {
                    request_uuid: "u-1".to_owned(),
                    message: "Fixed".to_owned(),
                };
                drop(c.custd.post_status_page_update("d-1", &request, None));
            },
            shape::<SiteStatusUpdateHistory>,
        ),
    ]
}

fn rows() -> Vec<Row> {
    let mut rows = app_rows();
    rows.extend(app_alert_and_meeting_rows());
    rows.extend(measurement_rows());
    rows.extend(status_page_rows());
    rows.extend(surface_rows::site_rows());
    rows.extend(surface_rows::admin_rows());
    rows.extend(surface_rows::measurement_and_reporting_rows());
    rows.extend(surface_rows::platform_admin_rows());
    rows.extend(surface_rows::ingest_rows());
    rows
}

fn api_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contract-fixtures/api")
}

fn read_json(path: &Path) -> Value {
    let text = std::fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&text).unwrap()
}

#[test]
fn every_row_sends_its_operation_method_and_path() {
    for row in rows() {
        let server = FakeServer::start(vec![answer(204, "")]);
        let clients = Clients {
            custd: CustdClient::new(&server.base_url, "t"),
            app: AppClient::new(&server.base_url, "site-key", "https://app.example"),
            base_url: server.base_url.clone(),
        };
        (row.call)(&clients);
        let received = server.next();
        let method = row
            .method
            .unwrap_or_else(|| row.id.split(' ').nth(1).unwrap());
        assert_ne!(method, "ANY", "{} needs the method it sends", row.id);
        assert_eq!(
            (received.method.as_str(), received.target.as_str()),
            (method, row.path),
            "{} sent body {}",
            row.id,
            received.body
        );
        assert_eq!(
            received.header("x-custd-sdk"),
            Some(SDK_IDENTITY),
            "{}",
            row.id
        );
    }
}

#[test]
fn coverage_file_lists_exactly_the_rows() {
    let rows: BTreeSet<&str> = rows().iter().map(|row| row.id).collect();
    let coverage = read_json(&api_dir().join("coverage/rust.json"));
    let covered: BTreeSet<&str> = coverage["operations"]
        .as_array()
        .unwrap()
        .iter()
        .map(|id| id.as_str().unwrap())
        .collect();
    assert_eq!(rows, covered);
}

#[test]
fn every_row_decodes_its_example_responses() {
    let snapshot = read_json(&api_dir().join("operations.json"));
    let operations = snapshot["operations"].as_array().unwrap();
    let mut failures = Vec::new();
    for row in rows() {
        let operation = operations
            .iter()
            .find(|operation| operation["id"] == row.id)
            .unwrap_or_else(|| panic!("{} is not in operations.json", row.id));
        let Some(example) = operation["example"].as_str() else {
            continue;
        };
        let Some(decode) = row.decode else {
            failures.push(format!(
                "{} has an example but its row decodes nothing",
                row.id
            ));
            continue;
        };
        let examples = read_json(&api_dir().join(example));
        for variant in ["minimal", "maximal"] {
            if let Err(error) = decode(&examples[variant]) {
                failures.push(format!("{} {variant}: {error}", row.id));
            }
        }
    }
    assert!(failures.is_empty(), "\n{}", failures.join("\n"));
}
