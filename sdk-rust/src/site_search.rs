//! Search for a domain: provider connections, performance, rows, inspections, the search pool, search value, exports and IndexNow.
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
pub struct SiteSearchAccount {
    pub bing_configured: bool,
    pub google_configured: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub google_service_account_email: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPerformance {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub connections: Vec<SiteSearchConnection>,
    pub days: i64,
    pub domain_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<SiteSearchSource>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub striking_distance: Vec<SiteSearchRow>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub top_pages: Vec<SiteSearchRow>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub top_queries: Vec<SiteSearchRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchConnection {
    /// The last day imported, YYYY-MM-DD.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub imported_through: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_imported_at: Option<String>,
    pub property: String,
    pub provider: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchSource {
    /// Each imported day's totals, oldest first; Bing's are week buckets.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub daily: Vec<SiteSearchDay>,
    /// Days with data inside the window.
    pub days: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    pub granularity: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub imported_at: Option<String>,
    /// Totals for the same number of days before the window, if any.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous: Option<SiteSearchTotals>,
    pub provider: String,
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    pub totals: SiteSearchTotals,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchRow {
    pub key: String,
    pub provider: String,
    pub totals: SiteSearchTotals,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchDay {
    pub clicks: i64,
    pub day: String,
    pub impressions: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchTotals {
    pub clicks: i64,
    pub ctr: f64,
    pub impressions: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub position: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchConnectionRequest {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    pub property: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchRowPage {
    pub days: i64,
    pub dimension: String,
    pub domain_uuid: String,
    pub limit: i64,
    pub offset: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<SiteSearchRow>,
    /// Rows matching the read before paging.
    pub total: i64,
    /// Providers that cannot report this dimension, not zero traffic.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub unavailable: Vec<SiteSearchUnavailable>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchUnavailable {
    pub provider: String,
    pub reason: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchInspectionList {
    pub daily_limit: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub inspections: Vec<SiteSearchInspection>,
    /// Inspections the tenant requested in the last 24 hours.
    pub used_today: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchInspection {
    /// Google's coverage text, such as Submitted and indexed.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub coverage_state: Option<String>,
    /// DESKTOP or MOBILE.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub crawled_as: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub google_canonical: Option<String>,
    /// Whether a noindex rule blocks indexing.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub indexing_state: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inspected_at: Option<String>,
    pub inspection_uuid: String,
    /// Absent when Google never crawled the URL.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_crawl_at: Option<String>,
    /// Absent when Google no longer reports mobile usability.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mobile_usability_verdict: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_fetch_state: Option<String>,
    pub requested_at: String,
    /// The inspection in the Search Console UI.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result_link: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub robots_txt_state: Option<String>,
    pub status: SiteSearchInspectionStatus,
    pub url: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_canonical: Option<String>,
    /// Whether the URL is indexed: PASS, PARTIAL, FAIL or NEUTRAL.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verdict: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchInspectionRequest {
    /// An http or https URL on the domain's own host.
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolSetting {
    /// Pool terms version the member accepted.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_terms_version: Option<String>,
    /// true while the tenant contributes to and may read the pool; false by default.
    pub joined: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub joined_at: Option<String>,
    /// Distinct tenants a query needs before it is pooled.
    pub min_contributors: i64,
    /// Pooled impressions a query needs over the window.
    pub min_impressions: i64,
    /// Current pool terms version, which a join must accept.
    pub terms_version: String,
    pub window_days: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolQueryPage {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub computed_at: Option<String>,
    /// First day the pool covers, YYYY-MM-DD.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    /// Busiest demand band first, then by query.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub queries: Vec<SiteSearchPoolQuery>,
    /// Last day the pool covers, YYYY-MM-DD.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolQuery {
    /// Pooled impressions over the window.
    pub demand_band: SiteSearchPoolQueryDemandBand,
    pub positions: SiteSearchPoolPositions,
    pub query: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolPositions {
    /// Positions after 20.
    pub beyond20: i64,
    /// Positions 4 to 10.
    pub top10: i64,
    /// Positions 11 to 20.
    pub top20: i64,
    /// Positions 1 to 3.
    pub top3: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolSettingRequest {
    /// true joins the pool, false leaves it.
    #[serde(default)]
    pub joined: Option<bool>,
    /// Required to join: the current terms version, accepted for the organisation.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terms_version: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchValue {
    pub attribution: String,
    pub days: i64,
    pub domain_uuid: String,
    pub from: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub goal_reason: Option<String>,
    pub goal_status: SiteSearchValueGoalStatus,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub goals: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteSearchValuePage>,
    pub site_uuid: String,
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchValuePage {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub goal_conversions: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub landings: Option<i64>,
    pub page_url: String,
    pub path: String,
    pub provider: SiteSearchProvider,
    pub search: SiteSearchTotals,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingImpact {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub after: Option<SiteSearchImpactWindow>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub before: Option<SiteSearchImpactWindow>,
    pub finding_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub fixed_at: Option<String>,
    pub note: String,
    pub page_url: String,
    pub rule: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<SiteFindingImpactSource>,
    pub status: SiteFindingImpactStatus,
    pub url: String,
    pub window_days: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchImpactWindow {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteFindingImpactSource {
    pub after: SiteSearchImpactPeriod,
    pub before: SiteSearchImpactPeriod,
    pub granularity: SiteFindingImpactSourceGranularity,
    pub provider: SiteSearchProvider,
    pub source: String,
    pub status: SiteFindingImpactSourceStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchImpactPeriod {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub clicks: Option<i64>,
    pub covered_days: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ctr: Option<f64>,
    pub expected_days: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub impressions: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub status: SiteFindingImpactSourceStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchMetricExportPage {
    pub domain_uuid: String,
    pub limit: i64,
    pub offset: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<SiteSearchMetricDay>,
    pub total: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchMetricDay {
    pub avg_position: f64,
    pub clicks: i64,
    pub day: String,
    pub dimension: SiteSearchMetricDayDimension,
    pub impressions: i64,
    pub key: String,
    pub provider: SiteSearchProvider,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIndexNowState {
    pub daily_url_limit: i64,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    /// Serve a text file here that holds only the key.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key_location: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_check_failure: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub submissions: Vec<SiteIndexNowSubmission>,
    /// URLs the tenant submitted in the last 24 hours.
    pub urls_today: i64,
    pub verified: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIndexNowSubmission {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<String>,
    /// IndexNow's HTTP status; 202 means received while the key is validated.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider_status: Option<i64>,
    pub requested_at: String,
    pub status: SiteIndexNowSubmissionStatus,
    pub submission_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub submitted_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub urls: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteIndexNowSubmissionRequest {
    /// 1 to 100 URLs on the domain's own host.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub urls: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchInspectionStatus {
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteSearchInspectionStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Done => "done",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchPoolQueryDemandBand {
    #[serde(rename = "100_999")]
    From100To999,
    #[serde(rename = "1k_10k")]
    From1kTo10k,
    #[serde(rename = "10k_100k")]
    From10kTo100k,
    #[serde(rename = "100k_plus")]
    From100kPlus,
}

impl SiteSearchPoolQueryDemandBand {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::From100To999 => "100_999",
            Self::From1kTo10k => "1k_10k",
            Self::From10kTo100k => "10k_100k",
            Self::From100kPlus => "100k_plus",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchValueGoalStatus {
    #[serde(rename = "measured")]
    Measured,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "unavailable")]
    Unavailable,
}

impl SiteSearchValueGoalStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Measured => "measured",
            Self::Partial => "partial",
            Self::Unavailable => "unavailable",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchProvider {
    #[serde(rename = "google")]
    Google,
    #[serde(rename = "bing")]
    Bing,
}

impl SiteSearchProvider {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Google => "google",
            Self::Bing => "bing",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteFindingImpactStatus {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "measured")]
    Measured,
    #[serde(rename = "insufficient")]
    Insufficient,
}

impl SiteFindingImpactStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Open => "open",
            Self::Measured => "measured",
            Self::Insufficient => "insufficient",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteFindingImpactSourceGranularity {
    #[serde(rename = "daily")]
    Daily,
    #[serde(rename = "weekly")]
    Weekly,
}

impl SiteFindingImpactSourceGranularity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Daily => "daily",
            Self::Weekly => "weekly",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteFindingImpactSourceStatus {
    #[serde(rename = "measured")]
    Measured,
    #[serde(rename = "insufficient")]
    Insufficient,
}

impl SiteFindingImpactSourceStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Measured => "measured",
            Self::Insufficient => "insufficient",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchMetricDayDimension {
    #[serde(rename = "total")]
    Total,
    #[serde(rename = "page")]
    Page,
    #[serde(rename = "query")]
    Query,
    #[serde(rename = "country")]
    Country,
    #[serde(rename = "device")]
    Device,
}

impl SiteSearchMetricDayDimension {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Total => "total",
            Self::Page => "page",
            Self::Query => "query",
            Self::Country => "country",
            Self::Device => "device",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteIndexNowSubmissionStatus {
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "accepted")]
    Accepted,
    #[serde(rename = "rejected")]
    Rejected,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteIndexNowSubmissionStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Accepted => "accepted",
            Self::Rejected => "rejected",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteSearchRowsDimension {
    #[serde(rename = "page")]
    Page,
    #[serde(rename = "query")]
    Query,
    #[serde(rename = "country")]
    Country,
    #[serde(rename = "device")]
    Device,
}

impl SiteSearchRowsDimension {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Page => "page",
            Self::Query => "query",
            Self::Country => "country",
            Self::Device => "device",
        }
    }
}

/// The filters and page of `list_site_search_rows`; unset fields use the server defaults.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiteSearchRowsQuery {
    /// Rows to page through; default query.
    pub dimension: Option<SiteSearchRowsDimension>,
    /// One provider's rows; default every provider.
    pub provider: Option<SiteSearchProvider>,
    /// Window length in days; default 28.
    pub days: Option<i64>,
    /// Rows to skip; default 0.
    pub offset: Option<i64>,
    /// Rows to return; default 100.
    pub limit: Option<i64>,
}

impl CustdClient {
    /// Get which search providers this deployment imports from.
    pub fn get_site_search_account(&self, company_slug: Option<&str>) -> Result<SiteSearchAccount> {
        let path = api_path(format!("{SITE_DOMAINS}/search-account"), &[], company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a domain's search clicks, impressions and positions with their source and coverage.
    pub fn get_site_search_performance(
        &self,
        domain_uuid: &str,
        days: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchPerformance> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/search", percent_encode(domain_uuid)),
            &[("days", days.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Connect a domain to Google Search Console or Bing Webmaster Tools.
    pub fn connect_site_search(
        &self,
        domain_uuid: &str,
        provider: SiteSearchProvider,
        request: &SiteSearchConnectionRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchConnection> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search/{}",
                percent_encode(domain_uuid),
                provider.as_str()
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Disconnect a provider and delete its imported numbers.
    pub fn disconnect_site_search(
        &self,
        domain_uuid: &str,
        provider: SiteSearchProvider,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search/{}",
                percent_encode(domain_uuid),
                provider.as_str()
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Retry a failing search import now.
    pub fn retry_site_search_import(
        &self,
        domain_uuid: &str,
        provider: SiteSearchProvider,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchConnection> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search/{}/retry",
                percent_encode(domain_uuid),
                provider.as_str()
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Page through a domain's imported search pages, queries, countries or devices.
    pub fn list_site_search_rows(
        &self,
        domain_uuid: &str,
        query: &SiteSearchRowsQuery,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchRowPage> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/search/rows", percent_encode(domain_uuid)),
            &[
                ("dimension", query.dimension.map(|v| v.as_str().to_owned())),
                ("provider", query.provider.map(|v| v.as_str().to_owned())),
                ("days", query.days.map(|v| v.to_string())),
                ("offset", query.offset.map(|v| v.to_string())),
                ("limit", query.limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a domain's recent Search Console URL inspections.
    pub fn list_site_search_inspections(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchInspectionList> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search/inspections",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Ask Google Search Console how one URL stands in its index.
    pub fn request_site_search_inspection(
        &self,
        domain_uuid: &str,
        request: &SiteSearchInspectionRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchInspection> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search/inspections",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get whether the tenant has joined the shared search pool.
    pub fn get_site_search_pool(
        &self,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchPoolSetting> {
        let path = api_path(format!("{SITE_DOMAINS}/search-pool"), &[], company_slug);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the shared search pool's demand and position bands per query.
    pub fn list_site_search_pool_queries(
        &self,
        search: Option<&str>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchPoolQueryPage> {
        let path = api_path(
            format!("{SITE_DOMAINS}/search-pool/queries"),
            &[
                ("search", search.map(str::to_owned)),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Join or leave the shared search pool.
    pub fn set_site_search_pool(
        &self,
        request: &SiteSearchPoolSettingRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchPoolSetting> {
        let path = api_path(format!("{SITE_DOMAINS}/search-pool"), &[], company_slug);
        self.call(Method::Put, &path, Some(request))
    }

    /// Get a domain's busiest search pages with the analytics goals each lands.
    pub fn get_site_search_value(
        &self,
        domain_uuid: &str,
        days: Option<i64>,
        goal: &[&str],
        company_slug: Option<&str>,
    ) -> Result<SiteSearchValue> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/search-value",
                percent_encode(domain_uuid)
            ),
            &[
                ("days", days.map(|v| v.to_string())),
                ("goal", Some(goal.join(","))),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a fixed finding's page clicks and impressions before and after the fix.
    pub fn get_site_finding_search_impact(
        &self,
        domain_uuid: &str,
        finding_uuid: &str,
        days: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteFindingImpact> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/findings/{}/search-impact",
                percent_encode(domain_uuid),
                percent_encode(finding_uuid)
            ),
            &[("days", days.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Page a domain's stored daily search metrics.
    pub fn export_site_search_metrics(
        &self,
        domain_uuid: &str,
        offset: Option<i64>,
        limit: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteSearchMetricExportPage> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/export/search-metrics",
                percent_encode(domain_uuid)
            ),
            &[
                ("offset", offset.map(|v| v.to_string())),
                ("limit", limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a domain's IndexNow key, its check and its latest submissions.
    pub fn get_site_index_now(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteIndexNowState> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/indexnow", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Give a verified domain an IndexNow key, or keep the one it has.
    pub fn enable_site_index_now(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteIndexNowState> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/indexnow", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, NO_BODY)
    }

    /// Delete a domain's IndexNow key and its submissions.
    pub fn disable_site_index_now(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/indexnow", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Check now that the site serves its IndexNow key file.
    pub fn verify_site_index_now_key(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteIndexNowState> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/indexnow/verify",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }

    /// Submit changed URLs of a domain to IndexNow.
    pub fn submit_site_index_now(
        &self,
        domain_uuid: &str,
        request: &SiteIndexNowSubmissionRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteIndexNowSubmission> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/indexnow/submissions",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }
}
