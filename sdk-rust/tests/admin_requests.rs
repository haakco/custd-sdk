//! Request details the surface rows do not see: headers, raw bodies and the owned-item query.

mod support;

use custd_sdk::{
    AppClient, AppItemRunCreateRequest, AuthDirectoryAction, AuthProjectDirectoryRequest,
    CustdClient, ImageFile, read_auth_domain_monitoring_inventory, read_shared_site_report,
};
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
