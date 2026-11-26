//! A Site's keywords: keyword lists and clusters, tracked rankings and the content gap.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_search::{SiteSearchPoolPositions, SiteSearchPoolQueryDemandBand};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordClusters {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub clusters: Vec<SiteKeywordCluster>,
    /// Bing keyword research for the list, apart from the Site's own numbers.
    pub demand: SiteKeywordDemandSet,
    pub metrics_days: i64,
    /// Where the numbers come from: the Site's own search imports.
    pub metrics_source: String,
    pub name: String,
    pub site_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub striking_distance: Vec<SiteKeywordStriking>,
    pub total_keywords: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordCluster {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avg_position: Option<f64>,
    /// Bing's latest weekly searches, summed.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bing_weekly_impressions: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub clicks: Option<i64>,
    /// The shared word stem that names the cluster.
    pub cluster: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub impressions: Option<i64>,
    pub keyword_count: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<String>,
    /// How many of the keywords have search numbers.
    pub measured_keywords: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordDemandSet {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<SiteKeywordDemand>,
    /// The market asked about, as a BCP 47 tag such as en-ZA.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub market: Option<String>,
    /// Where the numbers come from: bing_keyword_research.
    pub source: String,
    pub state: SiteKeywordDemandSetState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordStriking {
    pub clicks: i64,
    pub impressions: i64,
    pub keyword: String,
    pub position: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordDemand {
    /// Bing searches that contain the keyword in the week.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub broad_impressions: Option<i64>,
    pub checked_at: String,
    pub keyword: String,
    /// Why the latest read failed; it is retried a day later.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    /// The week's first day, YYYY-MM-DD.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub week_of: Option<String>,
    /// Bing searches for the exact keyword in the week.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub weekly_impressions: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordLists {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub lists: Vec<SiteKeywordList>,
    pub site_uuid: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordList {
    pub created_at: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub market_sample: Option<SiteMarketSample>,
    pub market_sample_enabled: bool,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub related: Option<SiteRelatedKeywords>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed_term: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMarketSample {
    /// Up to ten sampled results.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub hits: Vec<SiteMarketSearchHit>,
    pub observed_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRelatedKeywords {
    pub checked_at: String,
    pub from: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<SiteRelatedKeyword>,
    pub market: String,
    /// Where the keywords come from: bing_keyword_research.
    pub source: String,
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteMarketSearchHit {
    /// DeepSeek's authority tier, or -1 when unknown.
    pub authority: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRelatedKeyword {
    pub broad_impressions: i64,
    pub impressions: i64,
    pub keyword: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteKeywordListRequest {
    /// 1 to 500 keywords; repeats differing only in case or spacing are dropped.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<String>,
    /// Allow DeepSeek sampling of the public seed topic.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub market_sample_enabled: Option<bool>,
    /// The list's name, unique within the Site.
    pub name: String,
    /// An optional topic the list is about; its Wikipedia trend is read.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed_term: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRankings {
    /// First day of the window, YYYY-MM-DD.
    pub from: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub keywords: Vec<SiteTrackedKeyword>,
    pub max_keywords: i64,
    pub pool: SiteRankingsPool,
    pub source: SiteRankingsSource,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_failure: Option<String>,
    /// Last day of the window, YYYY-MM-DD: the newest day Search Console has final data for.
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrackedKeyword {
    pub country: String,
    pub created_at: String,
    pub device: String,
    pub keyword: String,
    pub keyword_uuid: String,
    /// The newest day in the window; no_data when nothing was read.
    pub latest: SiteRankObservation,
    pub notify_position: i64,
    /// Every day of the window, oldest first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub observations: Vec<SiteRankObservation>,
    /// The shared search pool's bands for the keyword, over every country and device.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pool: Option<SiteSearchPoolBand>,
    pub status: SiteTrackedKeywordStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRankObservation {
    pub clicks: i64,
    /// The day, YYYY-MM-DD.
    pub day: String,
    pub impressions: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub position: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ranking_url: Option<String>,
    pub state: SiteRankObservationState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteSearchPoolBand {
    /// Pooled impressions over the window.
    pub demand_band: SiteSearchPoolQueryDemandBand,
    pub positions: SiteSearchPoolPositions,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrackedKeywordRequest {
    /// ISO 3166-1 alpha-3 code such as zaf, or all (the default).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub country: Option<String>,
    /// desktop, mobile, tablet or all (the default).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub device: Option<String>,
    /// The search query, 1 to 100 characters, stored lower-case with single spaces.
    pub keyword: String,
    /// Alert when the position crosses this one, 1 to 100; 10 by default.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notify_position: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrackedKeywordUpdate {
    /// Alert position, 1 to 100; omitted keeps the current one.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notify_position: Option<i64>,
    /// true stops tracking: no observations are kept and no alert fires until resumed.
    pub paused: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteContentGap {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub competitors: Vec<SiteGapCompetitor>,
    pub own_coverage: SiteContentGapOwnCoverage,
    pub own_pages: i64,
    pub own_queries: i64,
    pub partial: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seed: Option<String>,
    pub site_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub topics: Vec<SiteGapTopic>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteGapCompetitor {
    pub domain: String,
    pub page_count: i64,
    pub sitemap_status: String,
    pub wayback_status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteGapTopic {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub competitors: Vec<String>,
    /// The most common wording of the topic in the page URLs.
    pub label: String,
    pub page_count: i64,
    /// Up to five of the pages, newest last-seen first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteGapPage>,
    /// The shared word stem of the competitor pages.
    pub topic: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteGapPage {
    pub domain: String,
    pub first_seen: String,
    pub last_seen: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub sources: Vec<String>,
    pub url: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteKeywordDemandSetState {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "no_market")]
    NoMarket,
    #[serde(rename = "no_bing")]
    NoBing,
}

impl SiteKeywordDemandSetState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::NoMarket => "no_market",
            Self::NoBing => "no_bing",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRankingsPool {
    #[serde(rename = "joined")]
    Joined,
    #[serde(rename = "not_joined")]
    NotJoined,
}

impl SiteRankingsPool {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Joined => "joined",
            Self::NotJoined => "not_joined",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRankingsSource {
    #[serde(rename = "not_connected")]
    NotConnected,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "failing")]
    Failing,
    #[serde(rename = "revoked")]
    Revoked,
}

impl SiteRankingsSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::NotConnected => "not_connected",
            Self::Pending => "pending",
            Self::Active => "active",
            Self::Failing => "failing",
            Self::Revoked => "revoked",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTrackedKeywordStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "paused")]
    Paused,
}

impl SiteTrackedKeywordStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Paused => "paused",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRankObservationState {
    #[serde(rename = "ranking")]
    Ranking,
    #[serde(rename = "not_ranking")]
    NotRanking,
    #[serde(rename = "no_data")]
    NoData,
}

impl SiteRankObservationState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ranking => "ranking",
            Self::NotRanking => "not_ranking",
            Self::NoData => "no_data",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteContentGapOwnCoverage {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "unavailable")]
    Unavailable,
}

impl SiteContentGapOwnCoverage {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::Unavailable => "unavailable",
        }
    }
}

impl CustdClient {
    /// Delete a Site's named keyword list.
    pub fn delete_site_keyword_list(
        &self,
        site_uuid: Option<&str>,
        name: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!("{SITE_DOMAINS}/keyword-lists"),
            &[
                ("siteUuid", site_uuid.map(str::to_owned)),
                ("name", Some(name.to_owned())),
            ],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Cluster one saved keyword list with the Site's own search numbers.
    pub fn get_site_keyword_clusters(
        &self,
        site_uuid: Option<&str>,
        name: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteKeywordClusters> {
        let path = api_path(
            format!("{SITE_DOMAINS}/keyword-clusters"),
            &[
                ("siteUuid", site_uuid.map(str::to_owned)),
                ("name", Some(name.to_owned())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// List a Site's saved keyword lists.
    pub fn list_site_keyword_lists(
        &self,
        site_uuid: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteKeywordLists> {
        let path = api_path(
            format!("{SITE_DOMAINS}/keyword-lists"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Create or replace a Site's named keyword list.
    pub fn save_site_keyword_list(
        &self,
        site_uuid: Option<&str>,
        request: &SiteKeywordListRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteKeywordList> {
        let path = api_path(
            format!("{SITE_DOMAINS}/keyword-lists"),
            &[("siteUuid", site_uuid.map(str::to_owned))],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Get a domain's tracked keywords with their ranking URL and position per day.
    pub fn get_site_rankings(
        &self,
        domain_uuid: &str,
        days: Option<i64>,
        company_slug: Option<&str>,
    ) -> Result<SiteRankings> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/rankings", percent_encode(domain_uuid)),
            &[("days", days.map(|v| v.to_string()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Start tracking a keyword of a domain in one country and device.
    pub fn track_site_keyword(
        &self,
        domain_uuid: &str,
        request: &SiteTrackedKeywordRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteTrackedKeyword> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/rankings/keywords",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Pause or resume a tracked keyword and set its alert position.
    pub fn update_site_tracked_keyword(
        &self,
        domain_uuid: &str,
        keyword_uuid: &str,
        request: &SiteTrackedKeywordUpdate,
        company_slug: Option<&str>,
    ) -> Result<SiteTrackedKeyword> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/rankings/keywords/{}",
                percent_encode(domain_uuid),
                percent_encode(keyword_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Stop tracking a keyword and delete its observations.
    pub fn untrack_site_keyword(
        &self,
        domain_uuid: &str,
        keyword_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/rankings/keywords/{}",
                percent_encode(domain_uuid),
                percent_encode(keyword_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// List the topics competitors publish pages about that the Site does not cover.
    pub fn get_site_content_gap(
        &self,
        site_uuid: Option<&str>,
        seed: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteContentGap> {
        let path = api_path(
            format!("{SITE_DOMAINS}/content-gap"),
            &[
                ("siteUuid", site_uuid.map(str::to_owned)),
                ("seed", seed.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }
}
