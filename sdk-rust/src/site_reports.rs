//! A domain's reports: the report, shares, saved reports, the insights export and campaign links.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_domains::{SiteDomain, SiteNextAction, SiteSummary, SiteUptimeStatus};
use crate::site_findings::SiteFindingListResponse;
use crate::site_keywords::{SiteKeywordLists, SiteRankings};
use crate::site_monitors::{
    SiteIncidentListResponse, SiteUptimeDay, SiteUptimeHistory, SiteUptimeWindows,
};
use crate::site_pages::{
    SiteLighthouseHistory, SiteLighthouseMetrics, SiteLighthousePageComparisonProfile,
    SiteLighthouseScores,
};
use crate::site_search::{
    SiteIndexNowState, SiteSearchInspectionList, SiteSearchRow, SiteSearchSource,
};
use crate::site_web_data::{SiteProjectContext, SiteTopicTrends, SiteWebDomains};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReport {
    pub audit: SiteReportAudit,
    pub certificate: SiteReportCertificate,
    pub generated_at: String,
    pub host: String,
    /// The next-actions read's first three; absent if saved earlier.
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub next_actions: Vec<SiteNextAction>,
    pub search: SiteReportSearch,
    /// The latest successful Lighthouse run per profile in the last 30 days.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub speed: Vec<SiteReportSpeed>,
    pub template: SiteReportTemplate,
    pub uptime: SiteReportUptime,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportAudit {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audited_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub findings: Vec<SiteReportFinding>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<SiteSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportCertificate {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
    /// The last certificate check failed.
    pub problem: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportSearch {
    /// Google or Bing is connected for this domain.
    pub connected: bool,
    pub days: i64,
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
pub struct SiteReportSpeed {
    pub metrics: SiteLighthouseMetrics,
    pub observed_at: String,
    pub profile: SiteLighthousePageComparisonProfile,
    pub scores: SiteLighthouseScores,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportUptime {
    /// Ninety UTC days, oldest first, ending today.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub days: Vec<SiteUptimeDay>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub down_since: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub monitored_since: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub response_ms: Option<i64>,
    pub status: SiteUptimeStatus,
    pub windows: SiteUptimeWindows,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportFinding {
    pub first_seen_at: String,
    pub fix: String,
    pub severity: String,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportShareListResponse {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub shares: Vec<SiteReportShare>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportShare {
    pub created_at: String,
    pub expires_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub report_uuid: Option<String>,
    pub share_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportShareRequest {
    /// Days the link works; default 30.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_in_days: Option<i64>,
    /// A saved report of the domain to share.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub report_uuid: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReportShareCreated {
    pub share: SiteReportShare,
    /// Open the report at /shared-report#<token>; shown once.
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSiteReportListResponse {
    /// How many saved reports a domain keeps.
    pub max_reports: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub reports: Vec<SavedSiteReportSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSiteReportSummary {
    pub created_at: String,
    pub days: i64,
    /// When the stored content was built; a replace builds it again.
    pub generated_at: String,
    /// Share links that open this report and have not expired.
    pub live_shares: i64,
    pub name: String,
    pub report_uuid: String,
    pub template: SiteReportTemplate,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSiteReport {
    pub created_at: String,
    pub days: i64,
    /// When the stored content was built; a replace builds it again.
    pub generated_at: String,
    /// Share links that open this report and have not expired.
    pub live_shares: i64,
    pub name: String,
    pub report: SiteReport,
    pub report_uuid: String,
    pub template: SiteReportTemplate,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedSiteReportRequest {
    /// Days of search numbers; default 28.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub days: Option<i64>,
    /// Unique among the domain's saved reports.
    pub name: String,
    /// Default full.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub template: Option<SiteReportTemplate>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsExport {
    pub domain: SiteDomain,
    pub exported_at: String,
    pub monitoring: SiteInsightsMonitoringExport,
    pub reports: SiteInsightsReportsExport,
    pub schema: String,
    pub search: SiteInsightsSearchExport,
    pub site: SiteInsightsSiteExport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsMonitoringExport {
    /// Every finding of the domain; more than findings holds only past 10000.
    pub finding_rows: i64,
    pub findings: SiteFindingListResponse,
    pub incidents: SiteIncidentListResponse,
    /// One history per measured page, home page first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub lighthouse: Vec<SiteLighthouseHistory>,
    pub uptime: SiteUptimeHistory,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsReportsExport {
    pub campaign_links: SiteCampaignLinkList,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub saved_reports: Vec<SavedSiteReport>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsSearchExport {
    pub index_now: SiteIndexNowState,
    pub inspections: SiteSearchInspectionList,
    /// Daily search metric rows, read in pages at /export/search-metrics.
    pub metric_rows: i64,
    pub rankings: SiteRankings,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteInsightsSiteExport {
    pub keyword_lists: SiteKeywordLists,
    pub project_context: SiteProjectContext,
    pub topic_trends: SiteTopicTrends,
    pub web_domains: SiteWebDomains,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCampaignLinkList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub links: Vec<SiteCampaignLink>,
    /// How many active links a domain may keep.
    pub max_links: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub suggested_mediums: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub suggested_sources: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCampaignLink {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub archived_at: Option<String>,
    pub campaign: String,
    pub content: String,
    pub created_at: String,
    pub link_uuid: String,
    pub medium: String,
    pub source: String,
    /// The link to share: url with its utm_* parameters.
    pub tagged_url: String,
    pub term: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteCampaignLinkRequest {
    /// utm_campaign, such as spring_sale.
    pub campaign: String,
    /// utm_content, which ad or link was clicked; optional.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    /// utm_medium, such as cpc, email or social.
    pub medium: String,
    /// utm_source, such as google or newsletter.
    pub source: String,
    /// utm_term, the paid keyword; optional.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub term: Option<String>,
    /// The page the link opens, on the domain's host.
    pub url: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteReportTemplate {
    #[serde(rename = "executive")]
    Executive,
    #[serde(rename = "full")]
    Full,
}

impl SiteReportTemplate {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Executive => "executive",
            Self::Full => "full",
        }
    }
}

impl CustdClient {
    /// Get a domain's client report: uptime, certificate, speed, search and what to fix.
    pub fn get_site_report(
        &self,
        domain_uuid: &str,
        template: Option<SiteReportTemplate>,
        days: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteReport> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/report", percent_encode(domain_uuid)),
            &[
                ("template", template.map(|v| v.as_str().to_owned())),
                ("days", days.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a domain's live report share links.
    pub fn list_site_report_shares(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteReportShareListResponse> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/report-shares",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create a link that opens the domain's report without a login.
    pub fn create_site_report_share(
        &self,
        domain_uuid: &str,
        request: &SiteReportShareRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteReportShareCreated> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/report-shares",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Revoke a report share link.
    pub fn revoke_site_report_share(
        &self,
        domain_uuid: &str,
        share_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/report-shares/{}",
                percent_encode(domain_uuid),
                percent_encode(share_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// List a domain's saved reports, newest first.
    pub fn list_saved_site_reports(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SavedSiteReportListResponse> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/saved-reports",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a saved report and its stored content.
    pub fn get_saved_site_report(
        &self,
        domain_uuid: &str,
        report_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SavedSiteReport> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/saved-reports/{}",
                percent_encode(domain_uuid),
                percent_encode(report_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Build the domain's report now and save it under a name.
    pub fn save_site_report(
        &self,
        domain_uuid: &str,
        request: &SavedSiteReportRequest,
        company_slug: Option<&str>,
    ) -> Result<SavedSiteReport> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/saved-reports",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Rebuild a saved report now, keeping its address and share links.
    pub fn replace_saved_site_report(
        &self,
        domain_uuid: &str,
        report_uuid: &str,
        request: &SavedSiteReportRequest,
        company_slug: Option<&str>,
    ) -> Result<SavedSiteReport> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/saved-reports/{}",
                percent_encode(domain_uuid),
                percent_encode(report_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Delete a saved report and revoke every link that opens it.
    pub fn delete_saved_site_report(
        &self,
        domain_uuid: &str,
        report_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/saved-reports/{}",
                percent_encode(domain_uuid),
                percent_encode(report_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Export a domain's Site Insights data.
    pub fn export_site_insights(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteInsightsExport> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/export", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a domain's saved campaign links, newest first.
    pub fn list_site_campaign_links(
        &self,
        domain_uuid: &str,
        archived: Option<bool>,
        company_slug: Option<&str>,
    ) -> Result<SiteCampaignLinkList> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/campaign-links",
                percent_encode(domain_uuid)
            ),
            &[("archived", archived.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Save a page link tagged with UTM campaign values.
    pub fn create_site_campaign_link(
        &self,
        domain_uuid: &str,
        request: &SiteCampaignLinkRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteCampaignLink> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/campaign-links",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Archive a campaign link, keeping it listed.
    pub fn archive_site_campaign_link(
        &self,
        domain_uuid: &str,
        link_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteCampaignLink> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/campaign-links/{}/archive",
                percent_encode(domain_uuid),
                percent_encode(link_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, NO_BODY)
    }
}
