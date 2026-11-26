mod support;

use custd_sdk::{
    CustdClient, Error, MeasurementForecastRunRequest, MeasurementObservation,
    MeasurementObservationBulk, MeasurementProjectCreate, MeasurementSeriesCreate,
    MeasurementSimulationRunRequest, MeasurementTargetCreate, SDK_IDENTITY,
};
use support::{FakeServer, answer};

const PROJECT: &str = r#"{"$schema":"x","projectUuid":"p-1","projectCode":"launch","kind":"deadline_forecast",
"status":"active","name":"Launch","description":"","series":null,"delivery":{"definitionOfDone":"shipped"},
"run":{"similar":false},"createdAt":"2026-11-17T00:00:00Z","updatedAt":"2026-11-17T00:00:00Z"}"#;

fn project_create() -> MeasurementProjectCreate {
    MeasurementProjectCreate {
        project_code: "launch".to_owned(),
        name: "Launch".to_owned(),
        kind: "deadline_forecast".to_owned(),
        description: None,
        series: vec![MeasurementSeriesCreate {
            series_code: "done".to_owned(),
            name: "Done".to_owned(),
            unit_slug: "count".to_owned(),
            completion_direction: "up".to_owned(),
            source: "manual".to_owned(),
        }],
        target: MeasurementTargetCreate {
            target_code: "all".to_owned(),
            name: "All".to_owned(),
            target_value: 10.0,
            target_date: None,
            state: "active".to_owned(),
        },
    }
}

#[test]
fn project_series_carry_the_unit_label() {
    let project = PROJECT.replace(
        r#""series":null"#,
        r#""series":[{"seriesUuid":"s-1","seriesCode":"done","name":"Done","unitSlug":"count","unitLabel":"tasks","completionDirection":"up","source":"manual"}]"#,
    );
    let server = FakeServer::start(vec![answer(200, &project)]);
    let client = CustdClient::new(&server.base_url, "token-1");

    let project = client.get_measurement_project("p-1", None).unwrap();

    assert_eq!(project.series[0].unit_label.as_deref(), Some("tasks"));
}

#[test]
fn creates_a_project_with_identity_and_bearer() {
    let server = FakeServer::start(vec![answer(201, PROJECT)]);
    let client = CustdClient::new(format!("{}/", server.base_url), "token-1");

    let project = client
        .create_measurement_project(&project_create(), None)
        .unwrap();

    assert_eq!(
        (project.project_uuid.as_str(), project.series.len()),
        ("p-1", 0)
    );
    let request = server.next();
    assert_eq!(
        (request.method.as_str(), request.target.as_str()),
        ("POST", "/api/v1/admin/measurement/projects")
    );
    assert_eq!(request.header("authorization"), Some("Bearer token-1"));
    assert_eq!(request.header("x-custd-sdk"), Some(SDK_IDENTITY));
    let body: serde_json::Value = serde_json::from_str(&request.body).unwrap();
    assert_eq!(body["series"][0]["unitSlug"], "count");
    assert!(body.get("description").is_none());
    assert!(!format!("{client:?}").contains("token-1"));
}

#[test]
fn observation_import_checks_every_row() {
    let short = r#"{"importId":"i-1","accepted":1,"rejected":0,"results":[{"rowIndex":0,"success":true,"observationUuid":"o-1"}]}"#;
    let server = FakeServer::start(vec![answer(202, short)]);
    let client = CustdClient::new(&server.base_url, "t");
    let row = || MeasurementObservation {
        series_uuid: "s-1".to_owned(),
        observed_at: "2026-11-17T00:00:00Z".to_owned(),
        value: 1.0,
        idempotency_key: None,
    };

    let result = client.add_measurement_observations(
        "p/1",
        &MeasurementObservationBulk {
            rows: vec![row(), row()],
        },
        None,
    );

    assert!(
        matches!(result, Err(Error::InvalidResponse(_))),
        "{result:?}"
    );
    assert_eq!(
        server.next().target,
        "/api/v1/admin/measurement/projects/p%2F1/observations:bulk"
    );
}

#[test]
fn problem_details_become_a_typed_error() {
    let problem = r#"{"type":"about:blank","title":"Not Found","status":404,"code":"measurement_project_not_found",
    "retryability":"none","nextAction":{}}"#;
    let server = FakeServer::start(vec![answer(404, problem)]);

    let result = CustdClient::new(&server.base_url, "t").get_measurement_project("missing", None);

    let Err(Error::Api(api)) = result else {
        panic!("want Api error, got {result:?}")
    };
    assert_eq!(api.status, 404);
    assert_eq!(
        api.problem.unwrap().code.as_deref(),
        Some("measurement_project_not_found")
    );
}

#[test]
fn forecast_runs_use_the_analytics_route_and_decode_the_counter() {
    let run = r#"{"forecastRunUuid":"f-1","projectUuid":"p-1","status":"completed","method":"poisson",
    "generatedAt":"2026-11-17T00:00:00Z","inputCount":3,"sampleCount":1000,"seed":7,"percentiles":{"p50":"2026-12-01T00:00:00Z"},
    "provenance":null,"warnings":null,"counter":{"pooledRunCount":0,"deadlineProbability":0.8,
    "detail":{"posteriorLines":[{"points":[{"at":"2026-11-18T00:00:00Z","value":4}]}],"arrivalHistogram":{"bins":null,"neverCount":2}}}}"#;
    let server = FakeServer::start(vec![answer(200, run)]);
    let client = CustdClient::new(&server.base_url, "t");

    let request = MeasurementForecastRunRequest {
        seed: Some(7),
        ..Default::default()
    };
    let forecast = client.run_measurement_forecast("p-1", &request).unwrap();

    let counter = forecast.counter.unwrap();
    assert_eq!(counter.deadline_probability, Some(0.8));
    assert_eq!(counter.detail.posterior_lines[0].points[0].value, 4.0);
    assert_eq!(forecast.percentiles["p50"], "2026-12-01T00:00:00Z");
    let received = server.next();
    assert_eq!(
        received.target,
        "/api/v1/measurement/projects/p-1/forecast-runs"
    );
    assert_eq!(received.body, r#"{"seed":7}"#);
}

#[test]
fn simulation_runs_decode_the_server_null_lists_and_map_as_empty() {
    let run = r#"{"simulationRunUuid":"s-1","projectUuid":"p-1","decisionUuid":"d-1","status":"completed",
    "method":"monte_carlo","generatedAt":"2026-11-17T00:00:00Z","completedAt":"2026-11-17T00:00:01Z",
    "sampleCount":1000,"seed":7,"variables":null,"provenance":null}"#;
    let server = FakeServer::start(vec![answer(200, run)]);
    let client = CustdClient::new(&server.base_url, "t");

    let request = MeasurementSimulationRunRequest {
        seed: Some(7),
        ..Default::default()
    };
    let simulation = client
        .create_measurement_simulation_run("p-1", "d-1", &request)
        .unwrap();

    assert!(simulation.variables.is_empty() && simulation.provenance.is_empty());
    assert_eq!(server.next().body, r#"{"seed":7}"#);
}
