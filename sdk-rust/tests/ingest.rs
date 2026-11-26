mod support;

use custd_sdk::{CustdClient, Error, EventEnvelope, SendEventsRequest};
use support::{FakeServer, answer};

const JOB: &str = r#"{"jobId":1,"jobUuid":"j-1","status":"queued","tenantSlug":"acme","scopeHash":"h",
"holdKind":"none","approval":{"Identity":"ops","ExpiresAt":"2026-12-01T00:00:00Z"},"items":null,
"createdAt":"2026-11-26T00:00:00Z"}"#;

#[test]
fn cleanup_job_calls_alone_carry_the_acting_company() {
    let server = FakeServer::start(vec![
        answer(200, r#"{"jobs":[]}"#),
        answer(200, JOB),
        answer(200, JOB),
        answer(200, r#"{"jobUuid":"j-1","status":"completed","proof":{}}"#),
        answer(
            200,
            r#"{"companySlug":"system","email":"ops@example.com","roles":[],"permissions":[]}"#,
        ),
    ]);
    let client = CustdClient::new(&server.base_url, "t").with_acting_company("acme");

    client.list_cleanup_jobs().unwrap();
    client.get_cleanup_job("j-1").unwrap();
    client.cancel_cleanup_job("j-1").unwrap();
    client.get_cleanup_job_proof("j-1").unwrap();
    client.get_current_account().unwrap();

    for (method, target) in [
        ("GET", "/api/v1/cleanup/jobs"),
        ("GET", "/api/v1/cleanup/jobs/j-1"),
        ("POST", "/api/v1/cleanup/jobs/j-1"),
        ("GET", "/api/v1/cleanup/jobs/j-1/proof"),
    ] {
        let request = server.next();
        assert_eq!(
            (request.method.as_str(), request.target.as_str()),
            (method, target)
        );
        assert_eq!(request.header("x-custd-effective-company"), Some("acme"));
    }
    assert_eq!(server.next().header("x-custd-effective-company"), None);
}

#[test]
fn a_batch_answer_that_contradicts_its_results_is_refused() {
    let answer_body = r#"{"success":true,"results":[{"eventUuid":"e-1","success":false,"status":422}],
"acceptedEventIds":["e-1"]}"#;
    let server = FakeServer::start(vec![answer(202, answer_body)]);
    let client = CustdClient::new(&server.base_url, "t");
    let request = SendEventsRequest {
        events: vec![EventEnvelope {
            event_uuid: "e-1".to_owned(),
            ..EventEnvelope::default()
        }],
    };

    let error = client.send_events(&request).unwrap_err();

    assert!(matches!(error, Error::InvalidResponse(_)), "{error}");
    assert!(server.next().body.contains(r#""eventUuid":"e-1""#));
}

#[test]
fn a_scheduled_task_read_decodes_the_task_and_its_runs() {
    let body = r#"{"task":{"taskName":"rollups","displayName":"Rollups","description":"","ownerService":"scheduler",
"enabled":true,"scheduleKind":"interval","scheduleExpression":"60s","timezone":"UTC","overlapPolicy":"skip",
"lockBackend":"postgres","timeoutSeconds":60,"manualRunsAllowed":true,"forceRunsAllowed":false,"queuedRuns":0,
"runningRuns":0,"failedRuns":0},"runs":null}"#;
    let server = FakeServer::start(vec![answer(200, body)]);
    let client = CustdClient::new(&server.base_url, "t");

    let detail = client.get_scheduled_task("rollups").unwrap();

    assert_eq!(
        (detail.task.task_name.as_str(), detail.runs.len()),
        ("rollups", 0)
    );
}
