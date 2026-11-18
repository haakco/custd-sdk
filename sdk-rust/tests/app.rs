mod support;

use custd_sdk::{
    APP_ALERT_DESTINATION_SLACK, APP_ALERT_NO_VERIFIED_EMAIL,
    APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW, APP_ITEM_KIND_LINK_COLLECTION,
    APP_ITEM_KIND_MEETING, APP_ITEM_MEETING_STEP_REFUSED, AppAlertRuleSpec, AppClient,
    AppItemCreate, AppMeetingBlockCreate, AppMeetingCreate, AppReadOptions, Conditional, Error,
    read_hosted_app_discovery,
};
use support::{Answer, FakeServer, answer};

const READ: &str = r#"{"item":{"itemUuid":"i-1","kind":"link_collection","role":"owner","version":3,
"ownership":"unowned","idleExpirySeconds":604800,"updatedAt":"2026-11-17T00:00:00Z","expiresAt":"2026-11-24T00:00:00Z"},
"links":null,"linkCollection":{"entries":[]}}"#;

#[test]
fn creates_with_the_site_key_and_reads_with_the_link() {
    let created = format!(r#"{{"item":{READ},"ownerToken":"own-1","shareToken":"shr-1"}}"#);
    let read = Answer {
        status: 200,
        headers: vec![("ETag", "\"v3\"")],
        body: READ.to_owned(),
    };
    let not_modified = Answer {
        status: 304,
        headers: vec![],
        body: String::new(),
    };
    let server = FakeServer::start(vec![answer(201, &created), read, not_modified]);
    let app = AppClient::new(
        &server.base_url,
        "site-key-1",
        "https://counter.apps.custd.com",
    );

    let request = AppItemCreate {
        kind: APP_ITEM_KIND_LINK_COLLECTION.to_owned(),
        ..AppItemCreate::default()
    };
    let created = app.create_item(&request).unwrap();
    assert_eq!(created.owner_token, "own-1");
    assert!(!format!("{created:?}").contains("own-1"));
    let create = server.next();
    assert_eq!(
        (create.method.as_str(), create.target.as_str()),
        ("POST", "/api/v1/app/items")
    );
    assert_eq!(create.header("x-custd-site-key"), Some("site-key-1"));
    assert_eq!(
        create.header("origin"),
        Some("https://counter.apps.custd.com")
    );
    assert_eq!(create.header("authorization"), None);
    assert_eq!(create.body, r#"{"kind":"link_collection"}"#);

    let link = app.link(&created.share_token);
    let Conditional::Modified { etag, value } = link.read(&AppReadOptions::default()).unwrap()
    else {
        panic!("want a fresh read")
    };
    assert_eq!((etag.as_deref(), value.item.version), (Some("\"v3\""), 3));
    assert_eq!(server.next().header("authorization"), Some("Bearer shr-1"));

    let options = AppReadOptions {
        item: Some("i-2".to_owned()),
        if_none_match: etag,
    };
    assert!(matches!(
        link.read(&options).unwrap(),
        Conditional::NotModified
    ));
    let conditional = server.next();
    assert_eq!(conditional.target, "/api/v1/app/item?item=i-2");
    assert_eq!(conditional.header("if-none-match"), Some("\"v3\""));
}

#[test]
fn bodyless_writes_send_no_body() {
    let rotated = r#"{"link":{"linkUuid":"l-1","role":"share","createdAt":"2026-11-17T00:00:00Z"},"token":"new-1"}"#;
    let no_content = Answer {
        status: 204,
        headers: vec![],
        body: String::new(),
    };
    let server = FakeServer::start(vec![answer(200, rotated), no_content]);
    let app = AppClient::new(
        &server.base_url,
        "site-key-1",
        "https://counter.apps.custd.com",
    );
    let link = app.link("own-1");

    assert_eq!(link.rotate_link("l-1").unwrap().token, "new-1");
    link.revoke_link("l-1").unwrap();

    for (method, target) in [
        ("POST", "/api/v1/app/item/links/l-1/rotate"),
        ("DELETE", "/api/v1/app/item/links/l-1"),
    ] {
        let request = server.next();
        assert_eq!(
            (request.method.as_str(), request.target.as_str()),
            (method, target)
        );
        assert_eq!(
            (request.body.as_str(), request.header("content-type")),
            ("", None)
        );
    }
}

fn app(server: &FakeServer) -> AppClient {
    AppClient::new(
        &server.base_url,
        "site-key-1",
        "https://counter.apps.custd.com",
    )
}

fn no_content() -> Answer {
    Answer {
        status: 204,
        headers: vec![],
        body: String::new(),
    }
}

const MEETING_READ: &str = r#"{"item":{"itemUuid":"m-1","kind":"meeting","role":"owner","ownership":"yours",
"version":2,"idleExpirySeconds":604800,"updatedAt":"2026-11-17T00:00:00Z","expiresAt":"2026-11-24T00:00:00Z"},
"meeting":{"name":"Standup","status":"running","startedAt":"2026-11-17T09:00:00Z","endsAt":"2026-11-17T09:15:00Z",
"currentBlockUuid":"b-1","blocks":[{"blockUuid":"b-1","position":1,"title":"Updates","status":"active",
"predictedMs":600000,"allocatedMs":540000,"actualMs":0,"startedAt":"2026-11-17T09:00:00Z"}],
"summary":{"predictedMs":900000,"finishedPredictedMs":0,"finishedActualMs":0,"finishedBlocks":0,"overrunMs":0}}}"#;

#[test]
fn signed_in_calls_send_the_user_token_and_reach_owned_items() {
    let list = r#"{"items":[{"itemUuid":"m-1","kind":"meeting","role":"owner","ownership":"yours","version":2,
"idleExpirySeconds":604800,"updatedAt":"2026-11-17T00:00:00Z","expiresAt":"2026-11-24T00:00:00Z",
"name":"Standup","status":"running"}]}"#;
    let server = FakeServer::start(vec![
        answer(200, list),
        answer(200, MEETING_READ),
        answer(200, MEETING_READ),
    ]);
    let app = app(&server).with_user_token("user-1");
    assert!(!format!("{app:?}").contains("user-1"));

    let items = app.list_my_items().unwrap().items;
    assert_eq!(
        (items[0].name.as_str(), items[0].status.as_str()),
        ("Standup", "running")
    );
    let listed = server.next();
    assert_eq!(
        (listed.method.as_str(), listed.target.as_str()),
        ("GET", "/api/v1/app/items")
    );
    assert_eq!(listed.header("x-custd-user-token"), Some("user-1"));
    assert_eq!(listed.header("authorization"), None);

    let claimed = app.link("own-1").claim().unwrap();
    assert_eq!(claimed.item.ownership, "yours");
    let claim = server.next();
    assert_eq!(
        (claim.method.as_str(), claim.target.as_str()),
        ("POST", "/api/v1/app/item/claim")
    );
    assert_eq!(claim.header("authorization"), Some("Bearer own-1"));
    assert_eq!(claim.header("x-custd-user-token"), Some("user-1"));

    let owned = app.owned_item("m-1");
    let Conditional::Modified { value, .. } = owned.read(&AppReadOptions::default()).unwrap()
    else {
        panic!("want a fresh read")
    };
    let meeting = value.meeting.unwrap();
    assert_eq!(meeting.current_block_uuid.as_deref(), Some("b-1"));
    assert_eq!(meeting.blocks[0].allocated_ms, 540_000);
    let read = server.next();
    assert_eq!(read.target, "/api/v1/app/item?item=m-1");
    assert_eq!(read.header("authorization"), None);
}

#[test]
fn meetings_are_created_started_advanced_and_ended() {
    let created = format!(r#"{{"item":{MEETING_READ},"ownerToken":"own-1","shareToken":"shr-1"}}"#);
    let refused = r#"{"type":"about:blank","title":"Conflict","status":409,"code":"app_item_meeting_step_refused"}"#;
    let server = FakeServer::start(vec![
        answer(201, &created),
        answer(200, MEETING_READ),
        answer(200, MEETING_READ),
        answer(409, refused),
        answer(200, MEETING_READ),
    ]);
    let app = app(&server);
    let request = AppItemCreate {
        kind: APP_ITEM_KIND_MEETING.to_owned(),
        meeting: Some(AppMeetingCreate {
            name: "Standup".to_owned(),
            blocks: vec![AppMeetingBlockCreate {
                title: "Updates".to_owned(),
                predicted_ms: 600_000,
            }],
        }),
        ..AppItemCreate::default()
    };
    app.create_item(&request).unwrap();
    assert_eq!(
        server.next().body,
        r#"{"kind":"meeting","meeting":{"name":"Standup","blocks":[{"title":"Updates","predictedMs":600000}]}}"#
    );

    let link = app.link("own-1");
    link.start_meeting().unwrap();
    link.advance_meeting("b-1").unwrap();
    let Err(Error::Api(stale)) = link.advance_meeting("b-0") else {
        panic!("want a refused advance")
    };
    assert_eq!(
        (stale.status, stale.code()),
        (409, Some(APP_ITEM_MEETING_STEP_REFUSED))
    );
    link.end_meeting().unwrap();

    let start = server.next();
    assert_eq!(
        (start.target.as_str(), start.body.as_str()),
        ("/api/v1/app/item/meeting/start", "")
    );
    let advance = server.next();
    assert_eq!(
        (advance.target.as_str(), advance.body.as_str()),
        ("/api/v1/app/item/meeting/advance", r#"{"blockUuid":"b-1"}"#)
    );
    server.next();
    assert_eq!(server.next().target, "/api/v1/app/item/meeting/end");
}

#[test]
fn alerts_manage_rules_webhooks_and_the_email_subscription() {
    let settings = r#"{"rules":null,"webhooks":null,"deliveryAvailable":true}"#;
    let rule = r#"{"ruleUuid":"r-1","type":"deadline_probability_below","threshold":0.5,"conditionMet":false,
"crossings":0,"createdAt":"2026-11-17T00:00:00Z"}"#;
    let webhook = r#"{"webhook":{"webhookUuid":"w-1","kind":"webhook","endpoint":"https://hooks.example.com/a",
"createdAt":"2026-11-17T00:00:00Z"},"signingSecret":"secret-1"}"#;
    let deliveries = r#"{"deliveries":[{"deliveryUuid":"d-1","ruleUuid":"r-1","ruleType":"target_reached",
"crossing":1,"channel":"email","outcome":"sent","attempts":1,"createdAt":"2026-11-17T00:00:00Z",
"updatedAt":"2026-11-17T00:00:00Z"}]}"#;
    let unverified = r#"{"type":"about:blank","title":"Unprocessable","status":422,"code":"app_alert_no_verified_email"}"#;
    let server = FakeServer::start(vec![
        answer(200, settings),
        answer(201, rule),
        no_content(),
        answer(201, webhook),
        no_content(),
        answer(422, unverified),
        answer(
            200,
            r#"{"subscriptionUuid":"s-1","createdAt":"2026-11-17T00:00:00Z"}"#,
        ),
        no_content(),
        answer(200, deliveries),
    ]);
    let app = app(&server).with_user_token("user-1");
    let link = app.link("own-1");

    let read = link.alert_settings().unwrap();
    assert!(read.delivery_available && read.rules.is_empty() && read.subscription.is_none());
    let spec = AppAlertRuleSpec {
        rule_type: APP_ALERT_RULE_DEADLINE_PROBABILITY_BELOW.to_owned(),
        threshold: Some(0.5),
        stale_days: None,
    };
    assert_eq!(link.add_alert_rule(&spec).unwrap().rule_uuid, "r-1");
    link.remove_alert_rule("r-1").unwrap();
    let created = link
        .add_alert_webhook("https://hooks.example.com/a")
        .unwrap();
    assert_eq!(created.signing_secret, "secret-1");
    assert!(!format!("{created:?}").contains("secret-1"));
    link.remove_alert_webhook("w-1").unwrap();
    let Err(Error::Api(refused)) = link.subscribe_alert_email() else {
        panic!("want a refused subscription")
    };
    assert_eq!(refused.code(), Some(APP_ALERT_NO_VERIFIED_EMAIL));
    assert_eq!(
        link.subscribe_alert_email().unwrap().subscription_uuid,
        "s-1"
    );
    link.unsubscribe_alert_email().unwrap();
    assert_eq!(
        link.alert_deliveries().unwrap().deliveries[0].outcome,
        "sent"
    );

    let sent: Vec<(String, String, String)> = (0..9)
        .map(|_| {
            let r = server.next();
            (
                r.method,
                r.target.replace("/api/v1/app/item/alerts", ""),
                r.body,
            )
        })
        .collect();
    let expected = [
        ("GET", "", ""),
        (
            "POST",
            "/rules",
            r#"{"type":"deadline_probability_below","threshold":0.5}"#,
        ),
        ("DELETE", "/rules/r-1", ""),
        (
            "POST",
            "/webhooks",
            r#"{"endpoint":"https://hooks.example.com/a"}"#,
        ),
        ("DELETE", "/webhooks/w-1", ""),
        ("PUT", "/subscription", ""),
        ("PUT", "/subscription", ""),
        ("DELETE", "/subscription", ""),
        ("GET", "/deliveries", ""),
    ];
    for (got, want) in sent.iter().zip(expected) {
        assert_eq!((got.0.as_str(), got.1.as_str(), got.2.as_str()), want);
    }
}

#[test]
fn alerts_add_a_slack_destination_and_remove_it_like_a_webhook() {
    let slack = r#"{"webhookUuid":"w-2","kind":"slack","endpoint":"hooks.slack.com/services/T0/…",
"createdAt":"2026-11-17T00:00:00Z"}"#;
    let server = FakeServer::start(vec![answer(201, slack), no_content()]);
    let app = app(&server);
    let link = app.link("own-1");

    let added = link
        .add_alert_slack("https://hooks.slack.com/services/T0/B0/x")
        .unwrap();
    link.remove_alert_webhook(&added.webhook_uuid).unwrap();

    assert_eq!(added.kind, APP_ALERT_DESTINATION_SLACK);
    let post = server.next();
    assert_eq!(
        (post.target.as_str(), post.body.as_str()),
        (
            "/api/v1/app/item/alerts/slack",
            r#"{"webhookUrl":"https://hooks.slack.com/services/T0/B0/x"}"#
        )
    );
    assert_eq!(server.next().target, "/api/v1/app/item/alerts/webhooks/w-2");
}

#[test]
fn reads_the_forecast_story_and_the_discovery_file() {
    let story = r#"{"projectUuid":"p-1","projectName":"Launch","projectKind":"deadline_forecast","state":"ready",
"truncated":false,"target":{"available":true,"label":"Done","value":10,"deadline":"2026-12-01T00:00:00Z"},
"observations":[{"observedAt":"2026-11-17T00:00:00Z","value":3}],"snapshots":null,
"delivery":{"estimates":null},"presentation":{"version":1,"presetId":"p","renderer":"r","caption":"c",
"summary":"s","nonColorEncoding":"n","width":10,"height":5,"layers":[{"kind":"line"}],"references":null,
"tableColumns":null,"tableRows":null},"trust":{"state":"ok","evidence":"e","observationCount":1,"snapshotCount":0},
"provenance":{"owner":"custd","generatedAt":"2026-11-17T00:00:00Z"}}"#;
    let discovery = r#"{"apiBaseUrl":"https://api.custd.com","host":"counter.apps.custd.com","siteUuid":"s-1",
"browserKey":"site_pk_1","environment":"prod","capabilities":["app_data","sign_in"],
"signIn":{"issuer":"https://auth","authorizationEndpoint":"https://auth/a","tokenEndpoint":"https://auth/t",
"clientId":"c-1","audience":"aud","redirectUri":"https://counter.apps.custd.com/cb"},
"allowedOrigins":["https://counter.apps.custd.com"],"newerField":1}"#;
    let server = FakeServer::start(vec![answer(200, story), answer(200, discovery)]);
    let app = app(&server);

    let Conditional::Modified { value, .. } = app
        .link("shr-1")
        .forecast_story(&AppReadOptions::default())
        .unwrap()
    else {
        panic!("want a fresh read")
    };
    assert_eq!(
        (value.project_name.as_str(), value.observations.len()),
        ("Launch", 1)
    );
    assert_eq!(value.presentation.layers[0]["kind"], "line");
    assert_eq!(server.next().target, "/api/v1/app/forecast/story");

    let read = read_hosted_app_discovery(&format!("{}/", server.base_url)).unwrap();
    assert_eq!(server.next().target, "/.well-known/custd.json");
    assert_eq!(
        (read.browser_key.as_str(), read.capabilities.len()),
        ("site_pk_1", 2)
    );
    assert_eq!(read.sign_in.as_ref().unwrap().client_id, "c-1");
    let from = AppClient::from_discovery(&read, &read.allowed_origins[0]);
    assert!(format!("{from:?}").contains("https://api.custd.com"));
}
