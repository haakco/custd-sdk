//! A Site's web data: topic and regional trends, web domains and pages, referring domains and project context.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::transport::Method;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTopicTrends {
    pub site_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub trends: Vec<SiteTopicTrend>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTopicTrend {
    pub article: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub months: Vec<SiteTrendMonth>,
    /// The Wikipedia read, such as en.wikipedia.
    pub project: String,
    pub source: SiteTopicTrendSource,
    pub status: SiteTopicTrendStatus,
    pub term: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrendMonth {
    /// YYYY-MM.
    pub month: String,
    pub views: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWebDomains {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub domains: Vec<SiteWebDomain>,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWebDomain {
    pub domain: String,
    /// When the last full inventory pass finished.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub inventory_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    pub next_inventory_at: String,
    /// Page URLs found so far; read with the statuses, a pending inventory has none yet.
    pub page_count: i64,
    pub role: SiteWebDomainRole,
    pub sitemap_status: SiteWebDomainSitemapStatus,
    pub tranco_band: SiteWebDomainTrancoBand,
    /// The day of the Tranco list read, YYYY-MM-DD.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tranco_list_day: Option<String>,
    /// The rank on the Tranco list; absent when unranked or unknown.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tranco_rank: Option<i64>,
    pub wayback_status: SiteWebDomainSitemapStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWebPages {
    pub domain: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteWebPage>,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWebPage {
    /// YYYY-MM-DD: a Wayback capture's day, or the day the sitemap was read.
    pub first_seen: String,
    /// YYYY-MM-DD.
    pub last_seen: String,
    /// sitemap, wayback or both.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<String>,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReferringDomains {
    /// Absent until a Common Crawl release is read for the domain.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub authority: Option<SiteDomainAuthority>,
    pub domain: String,
    pub lost: SiteLostLinks,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub referring_domains: Vec<SiteReferringDomain>,
    pub role: SiteWebDomainRole,
    pub site_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<SiteLinkSourceTotal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteDomainAuthority {
    /// The registrable domain the graph ranks.
    pub graph_domain: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub harmonic_centrality: Option<f64>,
    /// Position by harmonic centrality, 1 is best.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub harmonic_rank: Option<i64>,
    /// Host names the graph holds under the domain.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hosts: Option<i64>,
    /// False when the release does not hold the domain; the ranks are then absent.
    pub in_graph: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_rank: Option<f64>,
    /// Position by PageRank, 1 is best.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_rank_rank: Option<i64>,
    /// The Common Crawl web graph release, such as cc-main-2026-aug-sep-oct.
    pub release: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLostLinks {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub domains: Vec<SiteLostReferringDomain>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_release: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release: Option<String>,
    pub scope: String,
    pub status: SiteLostLinksStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteReferringDomain {
    /// One anchor text Bing or the crawl saw.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub anchor_text: Option<String>,
    /// Inbound links Bing listed from it; absent when Bing did not.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bing_links: Option<i64>,
    /// Links Custd's audits of the Site's other domains saw from it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub crawl_links: Option<i64>,
    pub domain: String,
    /// A crawled link from it is followed; absent without crawled links.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub followed: Option<bool>,
    /// Its harmonic centrality position in the Common Crawl release.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub harmonic_rank: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_rank_rank: Option<i64>,
    /// bing, commoncrawl and crawl: the sources that saw it link.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLinkSourceTotal {
    /// The day the source was read (YYYY-MM-DD), or the Common Crawl release.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub as_of: Option<String>,
    /// Every referring domain the source knows in scope is listed.
    pub complete: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    /// Links in scope; absent when the source does not count links.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub links: Option<i64>,
    /// How many of the referring domains are listed below.
    pub listed: i64,
    /// Linking registrable domains in scope.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub referring_domains: Option<i64>,
    /// What the totals cover, in words.
    pub scope: String,
    pub source: SiteLinkSourceTotalSource,
    pub status: SiteLinkSourceTotalStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLostReferringDomain {
    pub domain: String,
    /// Its position in the previous release.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub harmonic_rank: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRegionalTrends {
    pub has_saved_terms: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub markets: Vec<SiteRegionalTrendMarket>,
    pub site_uuid: String,
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub technical: Option<SiteTechnicalTrends>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRegionalTrendMarket {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    pub country: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub matches: Vec<SiteRegionalTrendMatch>,
    pub stale: bool,
    pub supported: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTechnicalTrends {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub matches: Vec<SiteRegionalTrendMatch>,
    pub source: String,
    pub stale: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRegionalTrendMatch {
    /// The original Hacker News discussion, when present.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub discussion_url: Option<String>,
    pub matched_term: String,
    pub published_at: String,
    pub source_url: String,
    pub topic: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProjectContext {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub brand_names: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub competitor_domains: Vec<String>,
    /// Whether this Site opted in to technical discussion topics.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hacker_news_enabled: Option<bool>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub markets: Vec<SiteMarket>,
    pub site_uuid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMarket {
    /// ISO 3166-1 alpha-2 country code, upper case, such as ZA.
    pub country: String,
    /// ISO 639 language code, lower case, such as en.
    pub language: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteProjectContextRequest {
    /// Up to 5 brand names, 1 to 100 characters each.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub brand_names: Vec<String>,
    /// Up to 10 competitor DNS names, such as competitor.example.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub competitor_domains: Vec<String>,
    /// Omit to keep the saved discussion topics setting.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hacker_news_enabled: Option<bool>,
    /// Up to 10 markets, each a country and a language.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub markets: Vec<SiteMarket>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTopicTrendSource {
    #[serde(rename = "brand")]
    Brand,
    #[serde(rename = "seed")]
    Seed,
}

impl SiteTopicTrendSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Brand => "brand",
            Self::Seed => "seed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTopicTrendStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "found")]
    Found,
    #[serde(rename = "no_article")]
    NoArticle,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteTopicTrendStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Found => "found",
            Self::NoArticle => "no_article",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteWebDomainRole {
    #[serde(rename = "own")]
    Own,
    #[serde(rename = "competitor")]
    Competitor,
}

impl SiteWebDomainRole {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Own => "own",
            Self::Competitor => "competitor",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteWebDomainSitemapStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "unavailable")]
    Unavailable,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteWebDomainSitemapStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Done => "done",
            Self::Partial => "partial",
            Self::Unavailable => "unavailable",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteWebDomainTrancoBand {
    #[serde(rename = "top-1k")]
    Top1k,
    #[serde(rename = "top-10k")]
    Top10k,
    #[serde(rename = "top-100k")]
    Top100k,
    #[serde(rename = "top-1m")]
    Top1m,
    #[serde(rename = "unranked")]
    Unranked,
    #[serde(rename = "unknown")]
    Unknown,
}

impl SiteWebDomainTrancoBand {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Top1k => "top-1k",
            Self::Top10k => "top-10k",
            Self::Top100k => "top-100k",
            Self::Top1m => "top-1m",
            Self::Unranked => "unranked",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLostLinksStatus {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "unavailable")]
    Unavailable,
}

impl SiteLostLinksStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::Pending => "pending",
            Self::Unavailable => "unavailable",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLinkSourceTotalSource {
    #[serde(rename = "bing")]
    Bing,
    #[serde(rename = "commoncrawl")]
    Commoncrawl,
    #[serde(rename = "crawl")]
    Crawl,
}

impl SiteLinkSourceTotalSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Bing => "bing",
            Self::Commoncrawl => "commoncrawl",
            Self::Crawl => "crawl",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLinkSourceTotalStatus {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "unavailable")]
    Unavailable,
}

impl SiteLinkSourceTotalStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::Pending => "pending",
            Self::Failed => "failed",
            Self::Unavailable => "unavailable",
        }
    }
}

/// The filters and page of `list_site_web_pages`; unset fields use the server defaults.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiteWebPagesQuery {
    /// The Site; a site-bound credential may omit it.
    pub site_uuid: Option<String>,
    /// One of the Site's own or competitor domains.
    pub domain: String,
    /// The next value of the previous page; omit for the first page.
    pub after: Option<String>,
    pub limit: Option<i64>,
}

impl CustdClient {
    /// Get Wikipedia pageview trends for a Site's brand names and seed terms.
    pub fn get_site_topic_trends(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteTopicTrends> {
        let path = api_path(
            format!("{SITE_DOMAINS}/topic-trends"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a Site's own and competitor domains with their inventory and Tranco band.
    pub fn get_site_web_domains(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteWebDomains> {
        let path = api_path(
            format!("{SITE_DOMAINS}/web-domains"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Page through one domain's page URLs with their sources and seen days.
    pub fn list_site_web_pages(
        &self,
        query: &SiteWebPagesQuery,
        company_slug: Option<&str>,
    ) -> Result<SiteWebPages> {
        let path = api_path(
            format!("{SITE_DOMAINS}/web-pages"),
            &[
                ("siteUuid", query.site_uuid.clone()),
                ("domain", Some(query.domain.clone())),
                ("after", query.after.clone()),
                ("limit", query.limit.map(|v| v.to_string())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get who links to one of a Site's domains, by source, with lost links since last quarter.
    pub fn get_site_referring_domains(
        &self,
        site_uuid: Option<&str>,
        domain: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteReferringDomains> {
        let path = api_path(
            format!("{SITE_DOMAINS}/referring-domains"),
            &[
                ("siteUuid", site_uuid.map(str::to_owned)),
                ("domain", Some(domain.to_owned())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get recent public trends matching a Site's saved terms.
    pub fn get_site_regional_trends(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteRegionalTrends> {
        let path = api_path(
            format!("{SITE_DOMAINS}/regional-trends"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a Site's brand names, named competitors and markets.
    pub fn get_site_project_context(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteProjectContext> {
        let path = api_path(
            format!("{SITE_DOMAINS}/project-context"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Replace a Site's brand names, named competitors and markets.
    pub fn set_site_project_context(
        &self,
        site_uuid: Option<&str>,
        request: &SiteProjectContextRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteProjectContext> {
        let path = api_path(
            format!("{SITE_DOMAINS}/project-context"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }
}
