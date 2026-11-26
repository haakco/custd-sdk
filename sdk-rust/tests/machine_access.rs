//! Machine access refusals, from the bodies the gate writes (contract-fixtures), and the request ID
//! a caller quotes.

mod support;

use custd_sdk::{
    CustdClient, Error, MACHINE_ACCESS_BLOCKED_CODE, MACHINE_ACCESS_UNAVAILABLE_CODE,
    MachineAccessBlock, MachineAccessCompanyUpdateRequest, record_metadata,
};
use support::{Answer, FakeServer, answer};

fn fixture(name: &str) -> String {
    std::fs::read_to_string(format!(
        "{}/../contract-fixtures/{name}",
        env!("CARGO_MANIFEST_DIR")
    ))
    .unwrap()
}

fn answering(status: u16, body: String) -> Answer {
    let mut answer = answer(status, &body);
    answer.headers.push(("X-Request-Id", "req-header-1"));
    answer
}

#[test]
fn blocked_refusal_names_the_area_and_the_setting() {
    let server = FakeServer::start(vec![answering(
        403,
        fixture("machine-access-blocked-problem.json"),
    )]);
    let client = CustdClient::new(&server.base_url, "t");

    let (result, metadata) = record_metadata(|| client.get_effective_machine_access("ci-1"));

    let Err(Error::Api(api)) = result else {
        panic!("a refusal was accepted");
    };
    assert_eq!(api.status, 403);
    assert_eq!(api.code(), Some(MACHINE_ACCESS_BLOCKED_CODE));
    assert_eq!(api.trace_id(), Some("req-machine-access-1"));
    assert_eq!(
        api.machine_access(),
        Some(&MachineAccessBlock {
            area: "reporting".to_owned(),
            blocked_by: "machine".to_owned(),
            company_slug: "acme".to_owned(),
            client_id: "ci-reporting".to_owned(),
        })
    );
    assert_eq!(metadata.request_id.as_deref(), Some("req-header-1"));
    assert_eq!(api.request_id.as_deref(), Some("req-header-1"));
}

#[test]
fn unavailable_refusal_is_a_bounded_retry_without_a_block() {
    let server = FakeServer::start(vec![answering(
        503,
        fixture("machine-access-unavailable-problem.json"),
    )]);
    let client = CustdClient::new(&server.base_url, "t");

    let Err(Error::Api(api)) = client.get_machine_access(None) else {
        panic!("a refusal was accepted");
    };
    assert_eq!(api.code(), Some(MACHINE_ACCESS_UNAVAILABLE_CODE));
    let problem = api.problem.as_deref().unwrap();
    assert_eq!(problem.retryability.as_deref(), Some("bounded"));
    assert_eq!(api.machine_access(), None);
}

#[test]
fn company_update_sends_only_the_settings_it_names_and_records_the_request_id() {
    let server = FakeServer::start(vec![answering(
        200,
        r#"{"companySlug":"acme","allowSupportAutomation":true,"areas":null}"#.to_owned(),
    )]);
    let client = CustdClient::new(&server.base_url, "t");
    let request = MachineAccessCompanyUpdateRequest {
        allow_support_automation: None,
        areas: Some(Vec::new()),
    };

    let (policy, metadata) = record_metadata(|| client.update_machine_access(&request, None));

    assert!(policy.unwrap().areas.is_empty());
    assert_eq!(metadata.request_id.as_deref(), Some("req-header-1"));
    let received = server.next();
    assert_eq!(received.method, "PUT");
    assert_eq!(received.target, "/api/v1/admin/machine-access");
    assert_eq!(received.header("authorization"), Some("Bearer t"));
    assert!(!received.headers.is_empty());
    assert_eq!(received.body, r#"{"areas":[]}"#);
}
