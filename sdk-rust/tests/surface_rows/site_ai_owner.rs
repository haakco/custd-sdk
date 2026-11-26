//! Rows for the AI owner handoff, its redeem and the owner session it opens.

use custd_sdk::{
    SiteAIConsentAction, SiteAIConsentRequest, SiteAIMode, SiteAIOwnerHandoffRequest,
    SiteAIOwnerHandoffResponse, SiteAIOwnerSession, SiteAISettingsRequest,
    redeem_site_ai_owner_handoff,
};

use super::round_trip;
use crate::support::{Answer, answer};
use crate::{Clients, Row, after, bodiless, row};

const SETTINGS: &str = r#"{"tenantSlug":"acme","sessionBinding":"b-1","settings":{"aiMode":"off","keyConfigured":false,"monthlyCapUsdMicros":0}}"#;

fn handoff(c: &Clients) -> SiteAIOwnerHandoffResponse {
    SiteAIOwnerHandoffResponse {
        code: "code-1".to_owned(),
        redeem_url: format!("{}/api/v1/site-ai-owner/redeem", c.base_url),
    }
}

fn redeemed() -> Answer {
    Answer {
        status: 303,
        headers: vec![(
            "Set-Cookie",
            "__Host-custd-site-ai-owner=h-1; Path=/; Secure; HttpOnly",
        )],
        body: String::new(),
    }
}

fn session(c: &Clients) -> SiteAIOwnerSession {
    redeem_site_ai_owner_handoff(&handoff(c), "https://hub.example").unwrap()
}

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api POST /api/v1/site-domains/ai-owner-handoffs",
            "/api/v1/site-domains/ai-owner-handoffs",
            |c| {
                let request = SiteAIOwnerHandoffRequest {
                    tenant_slug: "acme".to_owned(),
                    owner_subject: "owner-1".to_owned(),
                };
                drop(c.custd.create_site_ai_owner_handoff(&request))
            },
            round_trip::<SiteAIOwnerHandoffResponse>,
        ),
        bodiless(
            "admin-api POST /api/v1/site-ai-owner/redeem",
            "/api/v1/site-ai-owner/redeem",
            |c| {
                drop(redeem_site_ai_owner_handoff(
                    &handoff(c),
                    "https://hub.example",
                ))
            },
        ),
        after(
            || vec![redeemed()],
            bodiless(
                "admin-api GET /api/v1/site-ai-owner/settings",
                "/api/v1/site-ai-owner/settings",
                |c| drop(session(c).get_settings()),
            ),
        ),
        after(
            || vec![redeemed(), answer(200, SETTINGS)],
            bodiless(
                "admin-api PUT /api/v1/site-ai-owner/settings",
                "/api/v1/site-ai-owner/settings",
                |c| {
                    let request = SiteAISettingsRequest {
                        ai_mode: SiteAIMode::Platform,
                        api_key: None,
                        monthly_cap_usd_micros: 1,
                    };
                    drop(session(c).set_settings(&request))
                },
            ),
        ),
        after(
            || vec![redeemed(), answer(200, SETTINGS)],
            bodiless(
                "admin-api PUT /api/v1/site-ai-owner/consent",
                "/api/v1/site-ai-owner/consent",
                |c| {
                    let request = SiteAIConsentRequest {
                        action: SiteAIConsentAction::Grant,
                        terms_version: None,
                    };
                    drop(session(c).set_consent(&request))
                },
            ),
        ),
    ]
}
