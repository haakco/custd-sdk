use std::collections::VecDeque;
use std::sync::Mutex;

use super::*;

const ISSUER: &str = "https://auth.custd.test";

struct FakeTransport {
    answers: Mutex<VecDeque<std::result::Result<HttpResponse, TransportError>>>,
    requests: Mutex<Vec<HttpRequest>>,
}

impl FakeTransport {
    fn new(answers: Vec<std::result::Result<HttpResponse, TransportError>>) -> Self {
        Self {
            answers: Mutex::new(answers.into()),
            requests: Mutex::new(Vec::new()),
        }
    }

    fn token_requests(&self) -> Vec<String> {
        let requests = self.requests.lock().unwrap();
        requests
            .iter()
            .filter(|r| r.url.ends_with("/oauth2/token"))
            .map(|r| String::from_utf8(r.body.clone().unwrap_or_default()).unwrap())
            .collect()
    }
}

impl Transport for FakeTransport {
    fn send(&self, request: &HttpRequest) -> std::result::Result<HttpResponse, TransportError> {
        self.requests.lock().unwrap().push(request.clone());
        self.answers
            .lock()
            .unwrap()
            .pop_front()
            .expect("unexpected request")
    }

    fn stream(
        &self,
        _request: &HttpRequest,
    ) -> std::result::Result<crate::transport::HttpStream, TransportError> {
        unreachable!("login never streams a download")
    }
}

struct FakeClock {
    now: Mutex<Instant>,
    sleeps: Mutex<Vec<u64>>,
}

impl FakeClock {
    fn new() -> Self {
        Self {
            now: Mutex::new(Instant::now()),
            sleeps: Mutex::new(Vec::new()),
        }
    }
}

impl Clock for FakeClock {
    fn now(&self) -> Instant {
        *self.now.lock().unwrap()
    }
    fn sleep(&self, duration: Duration) {
        *self.now.lock().unwrap() += duration;
        self.sleeps.lock().unwrap().push(duration.as_secs());
    }
}

fn json(status: u16, body: &str) -> std::result::Result<HttpResponse, TransportError> {
    Ok(HttpResponse {
        status,
        headers: Vec::new(),
        body: body.as_bytes().to_vec(),
    })
}

fn metadata() -> std::result::Result<HttpResponse, TransportError> {
    json(
        200,
        r#"{"issuer":"https://auth.custd.test","authorization_endpoint":"https://auth.custd.test/oauth2/auth",
        "token_endpoint":"https://auth.custd.test/oauth2/token","jwks_uri":"https://auth.custd.test/.well-known/jwks.json",
        "device_authorization_endpoint":"https://auth.custd.test/oauth2/device/auth"}"#,
    )
}

fn authorization(
    verification_uri: &str,
    expires_in: i64,
) -> std::result::Result<HttpResponse, TransportError> {
    json(
        200,
        &format!(
            r#"{{"device_code":"dc-1","user_code":"ABCD1234","verification_uri":"{verification_uri}",
            "expires_in":{expires_in},"interval":0}}"#
        ),
    )
}

fn oauth_error(code: &str) -> std::result::Result<HttpResponse, TransportError> {
    json(400, &format!(r#"{{"error":"{code}"}}"#))
}

fn token() -> std::result::Result<HttpResponse, TransportError> {
    json(
        200,
        r#"{"access_token":"at-1","refresh_token":"rt-1","token_type":"bearer","expires_in":3600}"#,
    )
}

fn login() -> DeviceLogin {
    DeviceLogin {
        issuer_url: ISSUER.to_owned(),
        client_id: "custd-cli".to_owned(),
        scopes: vec!["openid".to_owned(), "offline_access".to_owned()],
        audience: Some("custd".to_owned()),
    }
}

fn run(
    answers: Vec<std::result::Result<HttpResponse, TransportError>>,
) -> (Result<DeviceToken>, FakeTransport, FakeClock) {
    let transport = FakeTransport::new(answers);
    let clock = FakeClock::new();
    let result = login().run_with(&transport, &clock, |_| {});
    (result, transport, clock)
}

#[test]
fn polls_at_the_provider_pace_until_approved() {
    let verification = "https://auth.custd.test/device";
    let pre_send = Err(TransportError::PreSend("connection refused".to_owned()));
    let answers = vec![
        metadata(),
        authorization(verification, 600),
        oauth_error("authorization_pending"),
        oauth_error("slow_down"),
        pre_send,
        token(),
    ];
    let transport = FakeTransport::new(answers);
    let clock = FakeClock::new();
    let mut shown = None;
    let token = login()
        .run_with(&transport, &clock, |i| shown = Some(i.clone()))
        .unwrap();

    assert_eq!(token.access_token, "at-1");
    assert_eq!(token.refresh_token.as_deref(), Some("rt-1"));
    assert!(
        !format!("{token:?}").contains("at-1"),
        "token Debug must redact"
    );
    let shown = shown.unwrap();
    assert_eq!(
        (shown.verification_uri.as_str(), shown.user_code.as_str()),
        (verification, "ABCD1234")
    );
    // Default 5s, unchanged after pending, +5s after slow_down and again after a failed connect.
    assert_eq!(*clock.sleeps.lock().unwrap(), vec![5, 5, 10, 15]);
    let forms = transport.token_requests();
    assert_eq!(forms.len(), 4);
    assert_eq!(
        forms[0],
        "client_id=custd-cli&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code&device_code=dc-1&audience=custd"
    );
    let authorize = transport.requests.lock().unwrap()[1].body.clone().unwrap();
    assert_eq!(
        String::from_utf8(authorize).unwrap(),
        "client_id=custd-cli&scope=openid%20offline_access&audience=custd"
    );
}

#[test]
fn terminal_poll_outcomes_end_the_login() {
    let cases = [
        (oauth_error("access_denied"), DeviceLoginError::Denied),
        (oauth_error("invalid_grant"), DeviceLoginError::Rejected),
        (json(503, "{}"), DeviceLoginError::Unconfirmed),
        (
            json(
                200,
                r#"{"access_token":"","token_type":"bearer","expires_in":60}"#,
            ),
            DeviceLoginError::Unconfirmed,
        ),
        (
            Err(TransportError::Failed("reset after send".to_owned())),
            DeviceLoginError::Unconfirmed,
        ),
    ];
    for (answer, want) in cases {
        let (result, transport, _) = run(vec![
            metadata(),
            authorization("https://auth.custd.test/device", 600),
            answer,
        ]);
        assert!(
            matches!(result, Err(Error::DeviceLogin(got)) if got == want),
            "want {want:?}"
        );
        assert_eq!(
            transport.token_requests().len(),
            1,
            "{want:?} must not poll again"
        );
    }
}

#[test]
fn local_expiry_stops_polling() {
    let pending = || oauth_error("authorization_pending");
    let (result, transport, clock) = run(vec![
        metadata(),
        authorization("https://auth.custd.test/device", 12),
        pending(),
        pending(),
    ]);
    assert!(matches!(
        result,
        Err(Error::DeviceLogin(DeviceLoginError::Expired))
    ));
    assert_eq!(transport.token_requests().len(), 2);
    assert_eq!(*clock.sleeps.lock().unwrap(), vec![5, 5, 2]);
}

#[test]
fn verification_uri_must_have_the_issuer_origin() {
    for uri in ["https://evil.test/device", "http://auth.custd.test/device"] {
        let (result, transport, _) = run(vec![metadata(), authorization(uri, 600)]);
        assert!(
            matches!(result, Err(Error::InvalidResponse(_))),
            "{uri} must be refused"
        );
        assert!(transport.token_requests().is_empty());
    }
}

#[test]
fn issuer_without_device_support_is_reported() {
    let answer = json(
        200,
        r#"{"issuer":"https://auth.custd.test","authorization_endpoint":"https://auth.custd.test/a",
        "token_endpoint":"https://auth.custd.test/t","jwks_uri":"https://auth.custd.test/j"}"#,
    );
    let (result, _, _) = run(vec![answer]);
    assert!(matches!(
        result,
        Err(Error::DeviceLogin(DeviceLoginError::Unsupported))
    ));
}

#[test]
fn resource_audience_is_sent_in_canonical_form() {
    assert_eq!(canonical_resource_uri("custd"), None);
    assert_eq!(
        canonical_resource_uri("HTTPS://API.Custd.com/v1/").as_deref(),
        Some("https://api.custd.com/v1")
    );
}

#[test]
fn user_code_display_groups() {
    assert_eq!(
        device_user_code_groups(" abcd-12\u{2013}34 "),
        vec!["ABCD", "1234"]
    );
    assert!(device_user_code_groups("").is_empty());
}
