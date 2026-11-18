mod support;

use custd_sdk::{
    APP_ITEM_KIND_LINK_COLLECTION, AppClient, AppItemCreate, AppReadOptions, Conditional,
};
use support::{Answer, FakeServer, answer};

const READ: &str = r#"{"item":{"itemUuid":"i-1","kind":"link_collection","role":"owner","version":3,
"idleExpirySeconds":604800,"updatedAt":"2026-11-17T00:00:00Z","expiresAt":"2026-11-24T00:00:00Z"},
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
        idle_expiry_seconds: None,
        measurement_project: None,
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
