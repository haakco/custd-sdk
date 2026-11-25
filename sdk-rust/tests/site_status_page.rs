mod support;

use custd_sdk::{
    CustdClient, SiteStatusComponentStatus, SiteStatusDraft, SiteStatusPage, SiteStatusSettings,
    SiteStatusUpdateRequest,
};
use serde_json::Value;
use support::{FakeServer, answer};

const FIXTURE: &str = include_str!("../../contract-fixtures/site-status-page.json");
const BASE: &str = "/api/v1/site-domains/d%2F1/status-page";

#[test]
fn status_page_calls_replay_the_shared_fixture() {
    let fixture: Value = serde_json::from_str(FIXTURE).unwrap();
    let json = |name: &str| fixture[name].to_string();
    let server = FakeServer::start(vec![
        answer(200, &json("statusPageSettings")),
        answer(200, &json("statusPagePreview")),
        answer(200, &json("statusPagePublication")),
        answer(204, ""),
        answer(200, &json("statusPageUpdateHistory")),
    ]);
    let client = CustdClient::new(&server.base_url, "t");
    let draft: SiteStatusDraft =
        serde_json::from_value(fixture["statusPageDraft"].clone()).unwrap();
    let slug = Some("acme");

    let settings = client.get_status_page_settings("d/1", slug).unwrap();
    let page = client.preview_status_page("d/1", &draft, None).unwrap();
    let publication = client.publish_status_page("d/1", &draft, None).unwrap();
    client.unpublish_status_page("d/1", None).unwrap();
    let update = SiteStatusUpdateRequest {
        request_uuid: "0198a3b2-0000-7000-8000-000000000070".to_owned(),
        message: "Service restored.".to_owned(),
    };
    let history = client
        .post_status_page_update("d/1", &update, None)
        .unwrap();

    assert_eq!(settings.draft.as_ref(), Some(&draft));
    assert_eq!(settings.publication.as_ref(), Some(&publication));
    let statuses: Vec<_> = page.components.iter().map(|c| c.status).collect();
    assert_eq!(
        statuses,
        [
            SiteStatusComponentStatus::Up,
            SiteStatusComponentStatus::Maintenance
        ]
    );
    assert_eq!(page.components[1].last_checked_at, None);
    assert_eq!(page.updates, history.updates);
    assert_eq!(
        publication.public_url("https://panel.example/"),
        "https://panel.example/status-page#AZijsgAAcACAAAAAAAAAAQGYo7IAAHAAgAAAAAAAAAE"
    );

    let sent: Vec<_> = (0..5).map(|_| server.next()).collect();
    let routes: Vec<_> = sent
        .iter()
        .map(|r| format!("{} {}", r.method, r.target))
        .collect();
    assert_eq!(
        routes,
        [
            format!("GET {BASE}?companySlug=acme"),
            format!("POST {BASE}/preview"),
            format!("PUT {BASE}"),
            format!("DELETE {BASE}"),
            format!("POST {BASE}/updates"),
        ]
    );
    let body = |i: usize| serde_json::from_str::<Value>(&sent[i].body).unwrap();
    assert_eq!(body(1), fixture["statusPageDraft"]);
    assert_eq!(body(2), fixture["statusPageDraft"]);
    assert_eq!(body(4), fixture["statusPageUpdateRequest"]);
    assert_eq!(sent[0].header("authorization"), Some("Bearer t"));

    let empty: SiteStatusSettings =
        serde_json::from_value(fixture["statusPageSettingsEmpty"].clone()).unwrap();
    let null_lists: SiteStatusPage =
        serde_json::from_str(r#"{"title":"t","components":null,"updates":null}"#).unwrap();
    assert_eq!((empty.draft, empty.publication), (None, None));
    assert!(null_lists.components.is_empty() && null_lists.updates.is_empty());
}
