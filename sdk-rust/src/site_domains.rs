//! A Site's domains (Admin API): claim, verify, attest, approve, audit, checks and next actions.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_analytics::SiteAIMode;
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(bound(deserialize = "D: Deserialize<'de>"))]
pub struct SiteDomainList<D> {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub domains: Vec<D>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainRecord<C> {
    pub audit: SiteDomainAudit,
    pub checks: C,
    pub created_at: String,
    pub domain_uuid: String,
    pub host: String,
    pub ownership: SiteDomainOwnership,
    pub site_uuid: String,
}

pub type SiteDomainListResponse = SiteDomainList<SiteDomain>;
pub type SiteDomainListWithUptimePaths = SiteDomainList<SiteDomainWithUptimePath>;
pub type SiteDomain = SiteDomainRecord<SiteDomainChecks>;
pub type SiteDomainWithUptimePath =
    SiteDomainRecord<SiteDomainCheckRecord<SiteHTTPPathExpectations>>;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainAudit {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_audited_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_summary: Option<SiteSummary>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requested_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainCheckRecord<E> {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub chrome_ux: Option<SiteChromeUX>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub http_expectations: Option<E>,
    pub mode: SiteDomainChecksMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub open_incident: Option<SiteIncident>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub registration: Option<SiteRegistrationExpiry>,
    pub tls: SiteTLS,
    pub uptime: SiteUptime,
    pub warming: SiteWarming,
}

pub type SiteDomainChecks = SiteDomainCheckRecord<SiteHTTPExpectations>;

/// HTTP expectations including the optional path configured on the verified host.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct SiteHTTPPathExpectations {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(flatten)]
    pub expectations: SiteHTTPExpectations,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainOwnership {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub attestation: Option<SiteDomainAttestation>,
    pub instructions: SiteDomainVerification,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_check_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_checked_at: Option<String>,
    pub verified: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_by: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_via_domain_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSummary {
    pub high: i64,
    pub info: i64,
    pub low: i64,
    pub medium: i64,
    pub pages_checked: i64,
    pub requests: i64,
    pub truncated: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteChromeUX {
    pub checked_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observation: Option<SiteChromeUXObservation>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHTTPExpectations {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub body_contains: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub json: Option<SiteHTTPJSONExpectation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_response_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status_code: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIncident {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub acknowledged_at: Option<String>,
    pub cause: String,
    pub failed_checks: i64,
    pub incident_uuid: String,
    pub opened_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub started_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRegistrationExpiry {
    pub domain: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub read_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTLS {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_checked_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteUptime {
    pub consecutive_failures: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_checked_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_ms: Option<i64>,
    pub status: SiteUptimeStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub status_code: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWarming {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_warmed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub unwarmed_response_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub warmed_response_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainAttestation {
    pub attested_at: String,
    pub client_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainVerification {
    pub dns_record_name: String,
    pub dns_record_value: String,
    pub file_content: String,
    pub file_url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteChromeUXObservation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cls: Option<f64>,
    pub first_date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inp_ms: Option<f64>,
    pub last_date: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lcp_ms: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHTTPJSONExpectation {
    pub field: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainCreateRequest {
    pub host: String,
    /// The Site the host belongs to; omit it to have Custd place the host.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub site_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCheckSettingsRequest {
    /// Omit to keep settings; send an empty object to clear.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub http_expectations: Option<SiteHTTPExpectations>,
    pub mode: SiteDomainChecksMode,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteBrowserCollectorRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub mode: SiteBrowserCollectorRequestMode,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteBrowserCollector {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allowed_origin: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub browser_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    pub mode: SiteBrowserCollectorRequestMode,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePortfolioSummary {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub domains: Vec<SitePortfolioDomain>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePortfolioDomain {
    pub action_count: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    pub domain_uuid: String,
    /// Absent when there is nothing to do.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub first_action: Option<SiteNextAction>,
    pub headline: String,
    pub host: String,
    pub open_findings: SiteFindingCounts,
    pub site_uuid: String,
    pub status: SiteUptimeStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteNextAction {
    /// Pages a finding affects; 0 when the action is about the whole site.
    pub affected_count: i64,
    /// See the operation for the kinds; show an unknown kind by its title.
    pub kind: String,
    /// Check again can confirm the fix now: Verify now, or a one-page recheck.
    pub recheckable: bool,
    /// The finding's rule, for a finding action.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rule: Option<String>,
    pub severity: SiteNextActionSeverity,
    pub target: SiteNextActionTarget,
    pub title: String,
    pub why: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingCounts {
    pub high: i64,
    pub info: i64,
    pub low: i64,
    pub medium: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteNextActionTarget {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub finding_uuid: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_url: Option<String>,
    /// ownership, uptime, search-settings, audit, finding or page; more may be added.
    pub place: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteNextActions {
    /// How many actions the domain has; at most three are returned.
    pub action_count: i64,
    /// The most important actions, most important first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub actions: Vec<SiteNextAction>,
    /// Account AI mode. Absent when status is unavailable.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_mode: Option<SiteAIMode>,
    /// The latest uptime check.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    pub domain_uuid: String,
    /// One plain sentence: whether the site works and how much is left to do.
    pub headline: String,
    pub host: String,
    /// What Custd cannot check yet: uptime, audit or search.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub not_checked: Vec<String>,
    pub status: SiteUptimeStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteDomainChecksMode {
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "uptime")]
    Uptime,
    #[serde(rename = "warm")]
    Warm,
}

impl SiteDomainChecksMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Paused => "paused",
            Self::Uptime => "uptime",
            Self::Warm => "warm",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteUptimeStatus {
    #[serde(rename = "unknown")]
    Unknown,
    #[serde(rename = "up")]
    Up,
    #[serde(rename = "failing")]
    Failing,
    #[serde(rename = "down")]
    Down,
    #[serde(rename = "paused")]
    Paused,
}

impl SiteUptimeStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Unknown => "unknown",
            Self::Up => "up",
            Self::Failing => "failing",
            Self::Down => "down",
            Self::Paused => "paused",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteBrowserCollectorRequestMode {
    #[serde(rename = "enabled")]
    Enabled,
    #[serde(rename = "disabled")]
    Disabled,
}

impl SiteBrowserCollectorRequestMode {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Enabled => "enabled",
            Self::Disabled => "disabled",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteNextActionSeverity {
    #[serde(rename = "high")]
    High,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "info")]
    Info,
}

impl SiteNextActionSeverity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::High => "high",
            Self::Medium => "medium",
            Self::Low => "low",
            Self::Info => "info",
        }
    }
}

impl CustdClient {
    /// List a Site's domains.
    pub fn list_site_domains(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteDomainListResponse> {
        self.list_site_domain_records(site_uuid, company_slug)
    }

    /// List domains, including their configured public uptime paths.
    pub fn list_site_domains_with_uptime_paths(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteDomainListWithUptimePaths> {
        self.list_site_domain_records(site_uuid, company_slug)
    }

    fn list_site_domain_records<T: serde::de::DeserializeOwned>(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<T> {
        let path = api_path(
            SITE_DOMAINS.to_owned(),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a domain and how to verify it.
    pub fn get_site_domain(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        self.get_site_domain_record(domain_uuid, company_slug)
    }

    /// Get a domain, including the configured public uptime path.
    pub fn get_site_domain_with_uptime_path(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomainWithUptimePath> {
        self.get_site_domain_record(domain_uuid, company_slug)
    }

    fn get_site_domain_record<T: serde::de::DeserializeOwned>(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<T> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Claim a host for a Site and get its verification token.
    pub fn create_site_domain(
        &self,
        request: &SiteDomainCreateRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(SITE_DOMAINS.to_owned(), &[], company_slug);
        self.call(Method::Post, &path, Some(request))
    }

    /// Remove a domain from a Site.
    pub fn delete_site_domain(&self, domain_uuid: &str, company_slug: Option<&str>) -> Result<()> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Check a domain's DNS record or well-known file now.
    pub fn verify_site_domain(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/verify", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Attest that the tenant controls a domain, verifying it and its subdomains.
    pub fn attest_site_domain(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/attestation", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Withdraw a domain's attestation.
    pub fn unattest_site_domain(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/attestation", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Mark a domain verified on a HaakCo system administrator's confirmation.
    pub fn approve_site_domain(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/approval", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Withdraw a HaakCo system administrator's approval of a domain.
    pub fn withdraw_site_domain_approval(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/approval", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Audit a verified domain on the scheduler's next tick.
    pub fn request_site_audit(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/audit", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Pause a domain's checks, check its uptime and certificate, or also keep its home page warm.
    pub fn set_site_check_mode(
        &self,
        domain_uuid: &str,
        request: &SiteCheckSettingsRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        self.put_site_check_settings(domain_uuid, request, company_slug)
    }

    /// Set uptime expectations for an absolute path on the verified host.
    pub fn set_site_check_path(
        &self,
        domain_uuid: &str,
        mode: SiteDomainChecksMode,
        path: &str,
        expectations: &SiteHTTPExpectations,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        #[derive(Serialize)]
        struct PathExpectations<'a> {
            path: &'a str,
            #[serde(flatten)]
            expectations: &'a SiteHTTPExpectations,
        }

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            mode: SiteDomainChecksMode,
            http_expectations: PathExpectations<'a>,
        }

        self.put_site_check_settings(
            domain_uuid,
            &Request {
                mode,
                http_expectations: PathExpectations { path, expectations },
            },
            company_slug,
        )
    }

    fn put_site_check_settings(
        &self,
        domain_uuid: &str,
        request: &impl Serialize,
        company_slug: Option<&str>,
    ) -> Result<SiteDomain> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/checks", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Enable or disable collection for a verified browser origin.
    pub fn converge_site_browser_collector(
        &self,
        domain_uuid: &str,
        request: &SiteBrowserCollectorRequest,
    ) -> Result<SiteBrowserCollector> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/browser-collector",
                percent_encode(domain_uuid)
            ),
            &[],
            None,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Get every domain's status, open findings and first action, worst first.
    pub fn get_site_portfolio_summary(
        &self,
        company_slug: Option<&str>,
    ) -> Result<SitePortfolioSummary> {
        let path = api_path(
            format!("{SITE_DOMAINS}/portfolio-summary"),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a domain's status and its three most important next actions.
    pub fn get_site_next_actions(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteNextActions> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/next-actions",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
