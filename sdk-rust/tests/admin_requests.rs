//! Request details the surface rows do not see: headers, raw bodies and the owned-item query.

mod support;

use custd_sdk::{
    AppClient, AppItemRunCreateRequest, AuditEventExport, AuditEventQuery, AuditEventsFormat,
    AuthDirectoryAction, AuthProjectDesiredState, AuthProjectDirectoryRequest, CustdClient,
    EmailRelayView, ImageFile, OffboardingDownload, SiteAIConsentAction, SiteAIConsentRequest,
    SiteAIOwnerHandoffResponse, SiteMonitorDestination, get_private_uptime_work,
    read_auth_domain_monitoring_inventory, read_shared_site_report, redeem_site_ai_owner_handoff,
};
use serde_json::json;
use support::{Answer, FakeServer, answer};

#[test]
fn idempotent_writes_send_the_idempotency_key() {
    let server = FakeServer::start(vec![answer(204, "")]);
    let client = CustdClient::new(&server.base_url, "t");
    let request = AuthProjectDirectoryRequest {
        expected_revision: 3,
        pool_id: "pool-1".to_owned(),
    };

    drop(client.act_on_auth_directory(
        "p-1",
        "e-1",
        AuthDirectoryAction::Pause,
        &request,
        "key-0001",
    ));

    let received = server.next();
    assert_eq!(received.method, "POST");
    assert_eq!(
        received.target,
        "/api/v1/admin/auth-projects/p-1/environments/e-1/directories/pause"
    );
    assert_eq!(received.header("idempotency-key"), Some("key-0001"));
    assert_eq!(received.header("authorization"), Some("Bearer t"));
}

#[test]
fn images_travel_as_raw_bytes_and_a_multipart_logo() {
    let photo = r#"{"fields":[],"managedPhoto":true}"#;
    let server = FakeServer::start(vec![
        Answer {
            status: 200,
            headers: vec![("Content-Type", "image/webp")],
            body: "webp".to_owned(),
        },
        answer(200, photo),
        answer(204, ""),
    ]);
    let client = CustdClient::new(&server.base_url, "app-token");
    let png = ImageFile {
        content_type: "image/png".to_owned(),
        bytes: b"png".to_vec(),
    };

    let read = client.get_current_app_profile_photo().unwrap();
    let profile = client.update_current_app_profile_photo(&png).unwrap();
    drop(client.set_auth_project_brand_logo("p-1", "e-1", &png));

    assert_eq!(
        (read.content_type.as_str(), read.bytes.as_slice()),
        ("image/webp", b"webp".as_slice())
    );
    assert_eq!(profile.managed_photo, Some(true));
    server.next();
    let put = server.next();
    assert_eq!(
        (put.header("content-type"), put.body.as_str()),
        (Some("image/png"), "png")
    );
    assert_eq!(put.header("authorization"), Some("Bearer app-token"));
    let logo = server.next();
    let content_type = logo.header("content-type").unwrap();
    let boundary = content_type
        .strip_prefix("multipart/form-data; boundary=")
        .unwrap();
    assert!(logo.body.starts_with(&format!("--{boundary}\r\n")));
    assert!(
        logo.body
            .contains("name=\"logo\"; filename=\"logo\"\r\nContent-Type: image/png\r\n\r\npng\r\n")
    );
    assert!(logo.body.ends_with(&format!("\r\n--{boundary}--\r\n")));
}

#[test]
fn public_routes_send_no_bearer_and_the_monitoring_key() {
    let server = FakeServer::start(vec![
        answer(200, r#"{"hosts":["a.example"],"retiredHosts":null}"#),
        answer(204, ""),
    ]);

    let inventory = read_auth_domain_monitoring_inventory(&server.base_url, "k-1").unwrap();
    drop(read_shared_site_report(&server.base_url, "t-1"));

    assert_eq!(inventory.hosts, vec!["a.example"]);
    assert!(inventory.retired_hosts.is_empty());
    let monitoring = server.next();
    assert_eq!(
        monitoring.header("x-custd-auth-domain-monitoring-key"),
        Some("k-1")
    );
    assert_eq!(monitoring.header("authorization"), None);
    assert_eq!(server.next().header("authorization"), None);
}

#[test]
fn an_owned_item_names_itself_after_the_query() {
    let server = FakeServer::start(vec![answer(204, ""), answer(204, "")]);
    let app =
        AppClient::new(&server.base_url, "site-key", "https://app.example").with_user_token("u-1");
    let run = AppItemRunCreateRequest {
        name: None,
        project_code: "launch".to_owned(),
        target_date: None,
    };

    drop(app.owned_item("i-1").list_runs(None, Some("a-1"), None));
    drop(app.owned_item("i-1").start_run(&run));

    assert_eq!(
        server.next().target,
        "/api/v1/app/item/runs?after=a-1&item=i-1"
    );
    let start = server.next();
    assert_eq!(start.target, "/api/v1/app/item/runs?item=i-1");
    assert_eq!(start.header("x-custd-user-token"), Some("u-1"));
    assert_eq!(start.header("authorization"), None);
}

#[test]
fn offboarding_downloads_stream_to_the_writer_checked_against_their_checksum_header() {
    let archive = |checksum: &'static str| Answer {
        status: 200,
        headers: vec![
            ("Content-Type", "application/zip"),
            ("X-Checksum-SHA256", checksum),
            ("X-Request-Id", "req-1"),
        ],
        body: "archive".to_owned(),
    };
    let good = "0eb3e36bfb24dcd9bb1d1bece1531216b59539a8fde17ee80224af0653c92aa3";
    let server = FakeServer::start(vec![
        archive(good),
        archive("0000000000000000000000000000000000000000000000000000000000000000"),
        answer(200, "archive"),
        answer(404, r#"{"title":"Not Found","status":404}"#),
    ]);
    let client = CustdClient::new(&server.base_url, "t");

    let mut written = Vec::new();
    let download = client.download_offboarding("r-1", &mut written).unwrap();
    assert_eq!(written, b"archive");
    assert_eq!(
        download,
        OffboardingDownload {
            content_type: "application/zip".to_owned(),
            request_id: Some("req-1".to_owned()),
            checksum_sha256: good.to_owned(),
            byte_size: 7,
        }
    );
    for refused in [
        "checksum mismatch",
        "checksum header is invalid",
        "HTTP 404",
    ] {
        let mut sink = Vec::new();
        let error = client
            .download_offboarding("r-1", &mut sink)
            .unwrap_err()
            .to_string();
        assert!(error.contains(refused), "{error}");
        if refused != "checksum mismatch" {
            assert!(sink.is_empty(), "{refused} wrote {sink:?}");
        }
    }
}

#[test]
fn audit_exports_stream_to_the_writer_with_their_metadata_and_realm_filter() {
    let server = FakeServer::start(vec![Answer {
        status: 200,
        headers: vec![("Content-Type", "text/csv"), ("X-Request-Id", "req-2")],
        body: "recordType,eventId\n".to_owned(),
    }]);
    let client = CustdClient::new(&server.base_url, "t");
    let query = AuditEventQuery {
        environment_id: Some("env-1".to_owned()),
        ..AuditEventQuery::default()
    };

    let mut written = Vec::new();
    let export = client
        .export_audit_events(&query, AuditEventsFormat::Csv, None, &mut written)
        .unwrap();

    assert_eq!(written, b"recordType,eventId\n");
    assert_eq!(
        export,
        AuditEventExport {
            content_type: "text/csv".to_owned(),
            request_id: Some("req-2".to_owned()),
        }
    );
    assert_eq!(
        server.next().target,
        "/api/v1/admin/audit/events/export?environmentId=env-1&format=csv"
    );
}

#[test]
fn a_realm_apply_sends_only_the_fields_it_sets_and_empty_values_clear() {
    let status: AuthProjectDesiredState = serde_json::from_str(
        r##"{"audiences":[],"brandAccent":"#112233","displayName":"","displayNameSource":"application","entryPath":"/go","identityMode":"isolated","loginPaused":true,"profileFields":[],"registrationPolicy":"invite_only","signInMethods":["password"]}"##,
    )
    .unwrap();
    assert_eq!(
        (
            status.entry_path.as_deref(),
            status.login_paused,
            status.sign_in_methods.as_deref()
        ),
        (
            Some("/go"),
            Some(true),
            Some(["password".to_owned()].as_slice())
        )
    );

    let keep = AuthProjectDesiredState {
        entry_path: None,
        brand_accent: None,
        login_paused: None,
        sign_in_methods: None,
        profile_fields: None,
        ..status.clone()
    };
    let sent = serde_json::to_value(&keep).unwrap();
    for field in [
        "entryPath",
        "brandAccent",
        "loginPaused",
        "signInMethods",
        "profileFields",
    ] {
        assert!(sent.get(field).is_none(), "{field} was sent: {sent}");
    }

    let clear = AuthProjectDesiredState {
        entry_path: Some(String::new()),
        brand_accent: Some(String::new()),
        login_paused: Some(false),
        sign_in_methods: Some(Vec::new()),
        profile_fields: Some(Vec::new()),
        ..status
    };
    let sent = serde_json::to_value(&clear).unwrap();
    assert_eq!(
        [
            &sent["entryPath"],
            &sent["brandAccent"],
            &sent["loginPaused"],
            &sent["signInMethods"],
            &sent["profileFields"]
        ],
        [
            &json!(""),
            &json!(""),
            &json!(false),
            &json!([]),
            &json!([])
        ]
    );
}

#[test]
fn an_email_relay_view_without_a_tenant_relay_decodes_the_null_relay() {
    let view: EmailRelayView = serde_json::from_str(
        r#"{"relay":null,"effective":{"fromAddress":"a@custd.dev","fromDisplayName":"Custd","hasCredential":true,"relay":"custd"}}"#,
    )
    .unwrap();
    assert_eq!(view.relay, None);
    assert_eq!(serde_json::to_value(&view).unwrap()["relay"], json!(null));
}

#[test]
fn a_prepared_data_query_sends_the_callers_document_verbatim() {
    let server = FakeServer::start(vec![answer(204, "")]);
    let client = CustdClient::new(&server.base_url, "t");
    let document = json!({"template": "x", "metrics": ["m"], "futureOption": {"k": 1}});

    drop(client.query_prepared_data_output("o-1", &document));

    let sent: serde_json::Value = serde_json::from_str(&server.next().body).unwrap();
    assert_eq!(sent, document);
}

#[test]
fn an_ai_owner_session_sends_its_cookie_and_binding_never_a_bearer() {
    let settings = r#"{"tenantSlug":"acme","sessionBinding":"b-1","settings":{"aiMode":"off","keyConfigured":false,"monthlyCapUsdMicros":0}}"#;
    let server = FakeServer::start(vec![
        Answer {
            status: 303,
            headers: vec![(
                "Set-Cookie",
                "__Host-custd-site-ai-owner=h-1; Path=/; HttpOnly",
            )],
            body: String::new(),
        },
        answer(200, settings),
        answer(
            200,
            r#"{"aiMode":"off","keyConfigured":false,"monthlyCapUsdMicros":0}"#,
        ),
    ]);
    let handoff = SiteAIOwnerHandoffResponse {
        code: "c 1".to_owned(),
        redeem_url: format!("{}/api/v1/site-ai-owner/redeem", server.base_url),
    };

    let mut session = redeem_site_ai_owner_handoff(&handoff, "https://hub.example").unwrap();
    let consent = SiteAIConsentRequest {
        action: SiteAIConsentAction::Grant,
        terms_version: None,
    };
    session.set_consent(&consent).unwrap();

    let redeem = server.next();
    assert_eq!(
        (redeem.header("origin"), redeem.body.as_str()),
        (Some("https://hub.example"), "code=c%201")
    );
    let read = server.next();
    assert_eq!(
        read.header("cookie"),
        Some("__Host-custd-site-ai-owner=h-1")
    );
    let write = server.next();
    assert_eq!(
        (
            write.method.as_str(),
            write.header("x-custd-site-ai-session")
        ),
        ("PUT", Some("b-1"))
    );
    assert_eq!(write.header("origin"), Some(server.base_url.as_str()));
    for request in [&redeem, &read, &write] {
        assert_eq!(request.header("authorization"), None);
    }
}

#[test]
fn a_site_monitor_sends_only_its_write_token_to_its_report_path() {
    let server = FakeServer::start(vec![answer(200, "{}")]);
    let destination = |report_path: &str| SiteMonitorDestination {
        base_url: server.base_url.clone(),
        report_path: report_path.to_owned(),
        write_token: "w".repeat(64),
    };

    get_private_uptime_work(&destination("/api/v1/site-private-uptime-reports/acme/m-1")).unwrap();
    let refused = get_private_uptime_work(&destination("/api/v1/admin/tenants"));

    let received = server.next();
    assert_eq!(
        received.header("authorization").map(str::to_owned),
        Some(format!("Bearer {}", "w".repeat(64)))
    );
    assert!(refused.is_err());
}
