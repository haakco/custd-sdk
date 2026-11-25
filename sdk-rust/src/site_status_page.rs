//! A Site's public status page (Admin API): draft, preview, publish, unpublish and updates.
//!
//! The shapes follow `AdminSiteStatus*` in the Go SDK. A system administrator names the tenant
//! with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

const SITE_DOMAINS: &str = "/api/v1/site-domains";

/// A verified domain and the label customers see for it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusSelection {
    pub domain_uuid: String,
    pub label: String,
}

/// The title and components to preview or publish.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusDraft {
    pub title: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub components: Vec<SiteStatusSelection>,
}

/// What customers see for one component.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SiteStatusComponentStatus {
    Unknown,
    Up,
    Failing,
    Down,
    Paused,
    Maintenance,
}

/// The public projection of a selected component.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusComponent {
    pub label: String,
    pub status: SiteStatusComponentStatus,
    #[serde(default)]
    pub last_checked_at: Option<String>,
}

/// An update approved for public display.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusUpdate {
    pub message: String,
    pub published_at: String,
}

/// The preview of what customers can see.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusPage {
    pub title: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub components: Vec<SiteStatusComponent>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub updates: Vec<SiteStatusUpdate>,
}

/// A published status page.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusPublication {
    pub public_key: String,
    pub published_at: String,
}

impl SiteStatusPublication {
    /// The customer link: `<panel origin>/status-page#<publicKey>`.
    pub fn public_url(&self, panel_origin: &str) -> String {
        format!(
            "{}/status-page#{}",
            panel_origin.trim_end_matches('/'),
            self.public_key
        )
    }
}

/// The private editor state for the Site.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusSettings {
    #[serde(default)]
    pub draft: Option<SiteStatusDraft>,
    #[serde(default)]
    pub publication: Option<SiteStatusPublication>,
}

/// A reviewed customer message and a stable retry ID.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusUpdateRequest {
    pub request_uuid: String,
    pub message: String,
}

/// The latest published updates.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteStatusUpdateHistory {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub updates: Vec<SiteStatusUpdate>,
}

fn status_page_path(domain_uuid: &str, suffix: &str, company_slug: Option<&str>) -> String {
    let path = format!(
        "{SITE_DOMAINS}/{}/status-page{suffix}",
        percent_encode(domain_uuid)
    );
    match company_slug.filter(|slug| !slug.is_empty()) {
        Some(slug) => format!("{path}?companySlug={}", percent_encode(slug)),
        None => path,
    }
}

const NO_BODY: Option<&()> = None;

impl CustdClient {
    /// Reads the saved draft and current publication, if any.
    pub fn get_status_page_settings(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteStatusSettings> {
        let path = status_page_path(domain_uuid, "", company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Shows the selected components without publishing the page.
    pub fn preview_status_page(
        &self,
        domain_uuid: &str,
        draft: &SiteStatusDraft,
        company_slug: Option<&str>,
    ) -> Result<SiteStatusPage> {
        let path = status_page_path(domain_uuid, "/preview", company_slug);
        self.call(Method::Post, &path, Some(draft))
    }

    /// Publishes the selected components; build the customer link with
    /// [`SiteStatusPublication::public_url`].
    pub fn publish_status_page(
        &self,
        domain_uuid: &str,
        draft: &SiteStatusDraft,
        company_slug: Option<&str>,
    ) -> Result<SiteStatusPublication> {
        let path = status_page_path(domain_uuid, "", company_slug);
        self.call(Method::Put, &path, Some(draft))
    }

    /// Removes public access and leaves the draft available.
    pub fn unpublish_status_page(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = status_page_path(domain_uuid, "", company_slug);
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Publishes a reviewed message and notifies confirmed subscribers.
    pub fn post_status_page_update(
        &self,
        domain_uuid: &str,
        request: &SiteStatusUpdateRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteStatusUpdateHistory> {
        let path = status_page_path(domain_uuid, "/updates", company_slug);
        self.call(Method::Post, &path, Some(request))
    }
}
