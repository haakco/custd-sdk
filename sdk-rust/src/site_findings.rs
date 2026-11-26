//! A domain's audit findings, dismissals, audited pages and the change since the last audit.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub findings: Vec<SiteFinding>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFinding {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dismissible: Option<bool>,
    pub evidence: String,
    pub finding_uuid: String,
    pub fix: String,
    pub history: SiteFindingHistory,
    /// A one-page recheck decides this rule, so Check again can confirm the fix.
    pub recheckable: bool,
    pub remedy: SiteRemedy,
    pub rule: String,
    pub severity: String,
    pub source: String,
    /// Optional AI explanation for this active finding.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<SiteFindingSuggestion>,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingHistory {
    pub first_seen_at: String,
    pub fixed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fixed_at: Option<String>,
    pub last_seen_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRemedy {
    /// The element, file or setting the fix changes.
    pub element: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub generated: Option<SiteGeneratedFix>,
    /// Absent when Custd has no remedy shape for the rule.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<SiteRemedyKind>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingSuggestion {
    pub explanation: String,
    pub next_step: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteGeneratedFix {
    pub code: String,
    pub format: SiteGeneratedFixFormat,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingDismissals {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub dismissals: Vec<SiteFindingDismissal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingDismissal {
    pub dismissal_uuid: String,
    pub dismissed_at: String,
    pub reason: String,
    pub rule: String,
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingDismissalRequest {
    pub finding_uuid: String,
    pub reason: String,
    pub scope: SiteFindingDismissalRequestScope,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAuditDelta {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audited_at: Option<String>,
    pub domain_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fixed: Vec<SiteFinding>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub new: Vec<SiteFinding>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reopened: Vec<SiteFinding>,
    pub run: SiteAuditDeltaRun,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAuditPageList {
    /// When the listed crawl ran; absent before the first audit.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audited_at: Option<String>,
    pub domain_uuid: String,
    pub limit: i64,
    pub offset: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteAuditPage>,
    pub total: i64,
    /// The crawl stopped at its bound; depth and inbound links are left out.
    pub truncated: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAuditPage {
    /// Clicks from the home page; absent when not known.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub depth: Option<i64>,
    /// Where the URL redirected to; empty when it did not redirect.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub final_url: Option<String>,
    /// Crawled pages that link here; absent on a truncated crawl.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inbound_links: Option<i64>,
    pub indexability: SiteAuditPageIndexability,
    /// Open findings on this URL; a site-wide finding counts on the page it names.
    pub open_findings: i64,
    /// HTTP status of the first response; 0 when the request failed.
    pub status: i64,
    pub url: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRemedyKind {
    #[serde(rename = "markup")]
    Markup,
    #[serde(rename = "setting")]
    Setting,
    #[serde(rename = "content")]
    Content,
    #[serde(rename = "server")]
    Server,
}

impl SiteRemedyKind {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Markup => "markup",
            Self::Setting => "setting",
            Self::Content => "content",
            Self::Server => "server",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteGeneratedFixFormat {
    #[serde(rename = "html")]
    Html,
    #[serde(rename = "robots.txt")]
    RobotsTxt,
    #[serde(rename = "redirect")]
    Redirect,
}

impl SiteGeneratedFixFormat {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Html => "html",
            Self::RobotsTxt => "robots.txt",
            Self::Redirect => "redirect",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteFindingDismissalRequestScope {
    #[serde(rename = "rule")]
    Rule,
    #[serde(rename = "url")]
    Url,
}

impl SiteFindingDismissalRequestScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Rule => "rule",
            Self::Url => "url",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAuditDeltaRun {
    #[serde(rename = "not_audited")]
    NotAudited,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "truncated")]
    Truncated,
    #[serde(rename = "complete")]
    Complete,
}

impl SiteAuditDeltaRun {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::NotAudited => "not_audited",
            Self::Failed => "failed",
            Self::Truncated => "truncated",
            Self::Complete => "complete",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAuditPageIndexability {
    #[serde(rename = "indexable")]
    Indexable,
    #[serde(rename = "noindex")]
    Noindex,
    #[serde(rename = "canonicalized")]
    Canonicalized,
    #[serde(rename = "redirected")]
    Redirected,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "not_html")]
    NotHtml,
}

impl SiteAuditPageIndexability {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Indexable => "indexable",
            Self::Noindex => "noindex",
            Self::Canonicalized => "canonicalized",
            Self::Redirected => "redirected",
            Self::Error => "error",
            Self::NotHtml => "not_html",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteFindingsState {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "fixed")]
    Fixed,
    #[serde(rename = "all")]
    All,
}

impl SiteFindingsState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Open => "open",
            Self::Fixed => "fixed",
            Self::All => "all",
        }
    }
}

impl CustdClient {
    /// List a domain's audit findings, most severe first.
    pub fn list_site_findings(
        &self,
        domain_uuid: &str,
        state: Option<SiteFindingsState>,
        company_slug: Option<&str>,
    ) -> Result<SiteFindingListResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/findings", percent_encode(domain_uuid)),
            &[("state", state.map(|v| v.as_str().to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List this domain's current audit finding dismissals.
    pub fn list_site_finding_dismissals(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteFindingDismissals> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/finding-dismissals",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Dismiss an observed audit finding rule or URL with a reason.
    pub fn dismiss_site_finding(
        &self,
        domain_uuid: &str,
        request: &SiteFindingDismissalRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteFindingDismissal> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/finding-dismissals",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Restore an audit finding to active reporting if it is still observed.
    pub fn restore_site_finding(
        &self,
        dismissal_uuid: &str,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/finding-dismissals/{}",
                percent_encode(domain_uuid),
                percent_encode(dismissal_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Get what the latest audit opened, reopened and fixed against the one before.
    pub fn get_site_audit_delta(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteAuditDelta> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/audit-delta", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List the URLs the latest audit crawled, with status, indexability, depth and inbound links.
    pub fn list_site_audit_pages(
        &self,
        domain_uuid: &str,
        offset: Option<i64>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteAuditPageList> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/audit-pages", percent_encode(domain_uuid)),
            &[
                ("offset", offset.map(|v| v.to_string())),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
