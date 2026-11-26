use std::collections::HashMap;
use std::sync::Mutex;

use super::*;
use crate::transport::{HttpResponse, TransportError};

#[derive(Default)]
struct TestTokenEndpoint(Mutex<Option<String>>);

impl Transport for TestTokenEndpoint {
    fn send(&self, request: &HttpRequest) -> std::result::Result<HttpResponse, TransportError> {
        assert_eq!(request.method, Method::Post);
        assert_eq!(request.url, "https://auth.example.test/oauth2/token");
        let body = request.body.as_deref().unwrap();
        let fields: HashMap<_, _> = url::form_urlencoded::parse(body).into_owned().collect();
        assert_eq!(fields["grant_type"], "authorization_code");
        assert_eq!(fields["client_id"], "public-app-client");
        assert_eq!(fields["code"], "browser+code");
        let challenge = URL_SAFE_NO_PAD.encode(digest::digest(
            &digest::SHA256,
            fields["code_verifier"].as_bytes(),
        ));
        let expected = self.0.lock().unwrap().take().unwrap();
        assert_eq!(challenge, expected);
        Ok(HttpResponse {
            status: 200,
            headers: Vec::new(),
            body: br#"{"access_token":"test-bearer","token_type":"Bearer","expires_in":300}"#
                .to_vec(),
        })
    }

    fn stream(
        &self,
        _request: &HttpRequest,
    ) -> std::result::Result<crate::transport::HttpStream, TransportError> {
        unreachable!("login never streams a download")
    }
}

fn discovery() -> HostedAppSignIn {
    HostedAppSignIn {
        issuer: "https://auth.example.test/".into(),
        authorization_endpoint: "https://auth.example.test/oauth2/auth".into(),
        token_endpoint: "https://auth.example.test/oauth2/token".into(),
        end_session_endpoint: None,
        client_id: "public-app-client".into(),
        audience: "https://app.example.test".into(),
        redirect_uri: "https://app.example.test/auth/callback".into(),
    }
}

#[test]
fn browser_login_ignores_wrong_state_and_exchanges_matching_pkce_code() {
    let port = {
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).unwrap();
        listener.local_addr().unwrap().port()
    };
    let endpoint = TestTokenEndpoint::default();
    let redirect = format!("http://localhost:{port}/callback");
    let login = BrowserLogin::new(&discovery(), redirect.clone(), vec!["openid".into()]);
    let token = login
        .run_with(&endpoint, Duration::from_secs(2), |url| {
            let url = Url::parse(url).unwrap();
            assert_eq!(url.path(), "/oauth2/auth");
            let query: HashMap<_, _> = url.query_pairs().into_owned().collect();
            assert_eq!(query["redirect_uri"], redirect);
            assert_eq!(query["audience"], discovery().audience);
            assert_eq!(query["code_challenge_method"], "S256");
            *endpoint.0.lock().unwrap() = Some(query["code_challenge"].clone());

            for (state, code) in [("wrong-state", "untrusted"), (&query["state"], "browser%2Bcode")] {
                let mut browser = TcpStream::connect((Ipv4Addr::LOCALHOST, port)).unwrap();
                write!(
                    browser,
                    "GET /callback?state={state}&code={code} HTTP/1.1\r\nHost: localhost:{port}\r\n\r\n"
                ).unwrap();
            }
        })
        .unwrap();
    assert_eq!(token.expires_in, Duration::from_secs(300));
    assert!(endpoint.0.lock().unwrap().is_none());
}

#[test]
fn browser_login_rejects_unbound_origins_before_opening_the_browser() {
    let mut sign_in = discovery();
    sign_in.token_endpoint = "https://other.example.test/oauth2/token".into();
    let endpoint = TestTokenEndpoint::default();
    let scopes = vec!["openid".into()];
    for (sign_in, redirect) in [
        (sign_in, "http://localhost:43159/callback"),
        (discovery(), "http://example.test:43159/callback"),
    ] {
        let login = BrowserLogin::new(&sign_in, redirect.into(), scopes.clone());
        assert!(matches!(
            login.run_with(&endpoint, Duration::from_secs(1), |_| panic!(
                "browser opened"
            )),
            Err(Error::InvalidInput(_))
        ));
    }
}
