//! Page tools for a domain: facts, rechecks, wording, robots tests, page queries and Lighthouse.
//!
//! Request and response shapes follow the admin-api OpenAPI document. A system administrator
//! names the tenant with `company_slug`, sent as `?companySlug=`; a tenant credential passes `None`.

use serde::{Deserialize, Serialize};

use crate::Result;
use crate::api_path::{NO_BODY, SITE_DOMAINS, api_path};
use crate::client::CustdClient;
use crate::measurement::null_as_empty;
use crate::site_findings::{SiteGeneratedFix, SiteRemedy};
use crate::transport::{Method, percent_encode};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageFacts {
    /// The <link rel=canonical> href, as written.
    pub canonical: String,
    pub description: String,
    /// FAQPage JSON-LD from question headings.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub faq_schema: Option<SiteGeneratedFix>,
    /// The page's headings in order, at most 50.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub headings: Vec<SitePageHeading>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub hreflang: Vec<SiteHreflangLink>,
    /// The <html lang> attribute, as written.
    pub lang: String,
    pub observed_at: String,
    pub open_graph: SitePageOpenGraph,
    pub readability: SitePageReadability,
    pub robots: SitePageRobots,
    /// An og:image candidate: the largest declared image, else the first unsized one.
    pub share_image: String,
    /// The page's HTTP status; 200 for a draft.
    pub status: i64,
    pub title: String,
    pub twitter: SitePageTwitter,
    pub url: String,
    /// Words of visible text in the HTML, before JavaScript runs.
    pub word_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageHeading {
    pub level: i64,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteHreflangLink {
    pub code: String,
    pub href: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageOpenGraph {
    pub description: String,
    pub image: String,
    pub site_name: String,
    pub title: String,
    pub r#type: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageReadability {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub flesch_reading_ease: Option<f64>,
    /// At 200 words a minute.
    pub reading_time_seconds: i64,
    pub sentences: i64,
    pub words_per_sentence: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageRobots {
    /// The X-Robots-Tag response header, empty when absent.
    pub header: String,
    pub nofollow: bool,
    pub noindex: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageTwitter {
    pub card: String,
    pub description: String,
    pub image: String,
    pub site: String,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageRecheckList {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rechecks: Vec<SitePageRecheck>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageRecheck {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub fixed_rules: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub open_rules: Vec<String>,
    pub recheck_uuid: String,
    pub requested_at: String,
    pub state: SitePageRecheckState,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageRecheckRequest {
    /// The page to check again, on the domain's host.
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteObservedWording {
    /// Absent when a page is unread or unavailable.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub comparison: Option<SiteWordingCompare>,
    pub first: SiteWordingObservation,
    pub second: SiteWordingObservation,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWordingCompare {
    /// False when either text is under minWords.
    pub compared: bool,
    pub first_words: i64,
    /// Texts shorter than this are not compared, as the crawl does not compare them.
    pub min_words: i64,
    pub near_duplicate: bool,
    pub second_words: i64,
    /// Estimated share of five-word phrases in common; 0 when not compared.
    pub shared_percent: i64,
    /// The share at which the crawl reports two pages as near-duplicates.
    pub threshold_percent: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWordingObservation {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub observed_at: Option<String>,
    pub state: SiteWordingObservationState,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageCheckRequest {
    /// The page's full HTML, or with scope content only its body content, at most 512 KiB.
    pub html: String,
    /// A search phrase (at most 100 characters) to find in the draft.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phrase: Option<String>,
    /// The page's current address, when publishing moves it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_url: Option<String>,
    /// page or content (body only).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope: Option<SitePageCheckRequestScope>,
    /// The address the draft will be published at, on the domain's host.
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageCheckResponse {
    /// With scope content, the rules checked; head rules are not among them.
    #[serde(
        default,
        deserialize_with = "null_as_empty",
        skip_serializing_if = "Vec::is_empty"
    )]
    pub checked_rules: Vec<String>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub findings: Vec<SitePageCheckFinding>,
    pub page: SitePageFacts,
    /// Where the requested phrase appears in the draft.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phrase: Option<SitePhraseUse>,
    /// The permanent redirect from previousUrl to url.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redirect: Option<SiteGeneratedFix>,
    /// The draft's scope; a recheck leaves it empty.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scope: Option<SitePageCheckRequestScope>,
    /// A URL slug made from the draft's first h1, else its title.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageCheckFinding {
    pub evidence: String,
    pub fix: String,
    pub remedy: SiteRemedy,
    pub rule: String,
    pub severity: String,
    pub source: String,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePhraseUse {
    /// How often the phrase appears in the visible text, ignoring case and punctuation.
    pub count: i64,
    /// Count divided by words, as a percentage; Custd sets no target.
    pub density_percent: f64,
    pub in_description: bool,
    pub in_h1: bool,
    pub in_title: bool,
    pub phrase: String,
    /// Words of visible text the count is out of.
    pub word_count: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRobotsTestRequest {
    /// A robots.txt to test; omit to read the domain's live file.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub robots_txt: Option<String>,
    /// The URL or path to test, such as /blog/post?id=1.
    pub url: String,
    /// The crawler's product token, such as Googlebot or GPTBot.
    pub user_agent: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRobotsTestResponse {
    pub allowed: bool,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub groups: Vec<String>,
    /// Why a live file decided without a rule: missing, or unreachable.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    /// The path and query the rules were matched against.
    pub path: String,
    /// The live file's HTTP status; 0 when pasted or unreachable.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub robots_status: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rule: Option<SiteRobotsRule>,
    pub source: SiteRobotsTestResponseSource,
    pub user_agent: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteRobotsRule {
    pub directive: SiteRobotsRuleDirective,
    /// The rule's line number in robots.txt, from 1.
    pub line: i64,
    pub pattern: String,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteWordingCompareRequest {
    /// The first page's HTML or plain text, at most 512 KiB.
    pub first: String,
    /// The second page's HTML or plain text, at most 512 KiB.
    pub second: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageSearchQueries {
    pub domain_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub link_sources: Vec<SiteLinkSource>,
    /// How many queries a page keeps, busiest by impressions.
    pub max_queries: i64,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub queries: Vec<SitePageQuery>,
    pub state: SitePageSearchQueriesState,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub title_options: Vec<SiteTitleOption>,
    pub url: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub window: Option<SitePageQueryWindow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLinkSource {
    /// The ranking query the linking page mentions; a natural link text.
    pub query: String,
    pub title: String,
    pub url: String,
    pub r#where: SiteLinkSourceWhere,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageQuery {
    pub clicks: i64,
    pub impressions: i64,
    pub in_description: bool,
    pub in_h1: bool,
    pub in_title: bool,
    /// Average position, weighted by impressions.
    pub position: f64,
    pub query: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTitleOption {
    /// The query's impressions; options are ranked by them.
    pub impressions: i64,
    /// The ranking query the title is built from.
    pub query: String,
    pub template: SiteTitleOptionTemplate,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SitePageQueryWindow {
    /// First day of the window, YYYY-MM-DD.
    pub from: String,
    pub imported_at: String,
    /// The provider the queries come from: google.
    pub provider: String,
    /// Last day of the window, YYYY-MM-DD.
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthouseHistory {
    pub days: i64,
    pub domain_uuid: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteLighthousePageComparison>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub runs: Vec<SiteLighthouseRun>,
    /// The page the runs measured: the home page unless ?url= names an extra page.
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthousePageComparison {
    pub latest_at: String,
    pub latest_score: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub previous_score: Option<i64>,
    pub profile: SiteLighthousePageComparisonProfile,
    /// A lighthouse.* regression finding is open on this page and profile.
    pub regression_open: bool,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthouseRun {
    pub duration_ms: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failure: Option<String>,
    pub metrics: SiteLighthouseMetrics,
    pub observed_at: String,
    pub outcome: SiteLighthouseRunOutcome,
    pub profile: SiteLighthousePageComparisonProfile,
    pub scores: SiteLighthouseScores,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tool_version: Option<String>,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthouseMetrics {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cumulative_layout_shift: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub first_contentful_paint_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub largest_contentful_paint_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub speed_index_ms: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub total_blocking_time_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthouseScores {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accessibility: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub best_practices: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub performance: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub seo: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthousePages {
    pub domain_uuid: String,
    pub home_page: String,
    /// How many extra pages a domain may set.
    pub max_pages: i64,
    /// The extra pages, in the order they were set.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub urls: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteLighthousePagesRequest {
    /// Pages on the domain's host beyond its home page; at most five.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub urls: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SitePageRecheckState {
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "checked")]
    Checked,
    #[serde(rename = "failed")]
    Failed,
}

impl SitePageRecheckState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Checked => "checked",
            Self::Failed => "failed",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteWordingObservationState {
    #[serde(rename = "unread")]
    Unread,
    #[serde(rename = "unavailable")]
    Unavailable,
    #[serde(rename = "short")]
    Short,
    #[serde(rename = "ready")]
    Ready,
}

impl SiteWordingObservationState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Unread => "unread",
            Self::Unavailable => "unavailable",
            Self::Short => "short",
            Self::Ready => "ready",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SitePageCheckRequestScope {
    #[serde(rename = "page")]
    Page,
    #[serde(rename = "content")]
    Content,
}

impl SitePageCheckRequestScope {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Page => "page",
            Self::Content => "content",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRobotsTestResponseSource {
    #[serde(rename = "pasted")]
    Pasted,
    #[serde(rename = "live")]
    Live,
}

impl SiteRobotsTestResponseSource {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pasted => "pasted",
            Self::Live => "live",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteRobotsRuleDirective {
    #[serde(rename = "allow")]
    Allow,
    #[serde(rename = "disallow")]
    Disallow,
}

impl SiteRobotsRuleDirective {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Allow => "allow",
            Self::Disallow => "disallow",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SitePageSearchQueriesState {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "not_connected")]
    NotConnected,
    #[serde(rename = "not_imported")]
    NotImported,
    #[serde(rename = "no_queries")]
    NoQueries,
}

impl SitePageSearchQueriesState {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::NotConnected => "not_connected",
            Self::NotImported => "not_imported",
            Self::NoQueries => "no_queries",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLinkSourceWhere {
    #[serde(rename = "title")]
    Title,
    #[serde(rename = "heading")]
    Heading,
}

impl SiteLinkSourceWhere {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Title => "title",
            Self::Heading => "heading",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTitleOptionTemplate {
    #[serde(rename = "general")]
    General,
    #[serde(rename = "guide")]
    Guide,
}

impl SiteTitleOptionTemplate {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::General => "general",
            Self::Guide => "guide",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLighthousePageComparisonProfile {
    #[serde(rename = "desktop")]
    Desktop,
    #[serde(rename = "mobile")]
    Mobile,
}

impl SiteLighthousePageComparisonProfile {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Desktop => "desktop",
            Self::Mobile => "mobile",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteLighthouseRunOutcome {
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "failed")]
    Failed,
}

impl SiteLighthouseRunOutcome {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Success => "success",
            Self::Failed => "failed",
        }
    }
}

impl CustdClient {
    /// Get what the latest check read from one page, for snippet and share previews.
    pub fn get_site_page_facts(
        &self,
        domain_uuid: &str,
        url: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePageFacts> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/page-facts", percent_encode(domain_uuid)),
            &[("url", Some(url.to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get several page rechecks at once, so a group of pages is followed with one read.
    pub fn list_site_page_rechecks(
        &self,
        domain_uuid: &str,
        ids: &[&str],
        company_slug: Option<&str>,
    ) -> Result<SitePageRecheckList> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/page-rechecks",
                percent_encode(domain_uuid)
            ),
            &[("ids", Some(ids.join(",")))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a page recheck's state and the rules it found open or fixed.
    pub fn get_site_page_recheck(
        &self,
        domain_uuid: &str,
        recheck_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePageRecheck> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/page-rechecks/{}",
                percent_encode(domain_uuid),
                percent_encode(recheck_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Check one page again on the scheduler's next tick.
    pub fn request_site_page_recheck(
        &self,
        domain_uuid: &str,
        request: &SitePageRecheckRequest,
        company_slug: Option<&str>,
    ) -> Result<SitePageRecheck> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/page-rechecks",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Compare wording from the latest stored observations of two pages on one verified domain.
    pub fn compare_site_page_wording(
        &self,
        domain_uuid: &str,
        first_url: &str,
        second_url: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteObservedWording> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/page-wording",
                percent_encode(domain_uuid)
            ),
            &[
                ("firstUrl", Some(first_url.to_owned())),
                ("secondUrl", Some(second_url.to_owned())),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Check draft HTML before publishing: page facts and findings, nothing stored.
    pub fn check_site_page(
        &self,
        domain_uuid: &str,
        request: &SitePageCheckRequest,
        company_slug: Option<&str>,
    ) -> Result<SitePageCheckResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/page-check", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Test whether a crawler may fetch a URL, and which robots.txt rule decides.
    pub fn test_site_robots(
        &self,
        domain_uuid: &str,
        request: &SiteRobotsTestRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteRobotsTestResponse> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/robots-test", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Compare how much wording two drafts share, as the near-duplicate rule measures it.
    pub fn compare_site_wording(
        &self,
        domain_uuid: &str,
        request: &SiteWordingCompareRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteWordingCompare> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/wording-compare",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Post, &path, Some(request))
    }

    /// Get the searches one page shows for, with title options and pages that could link to it.
    pub fn get_site_page_search_queries(
        &self,
        domain_uuid: &str,
        url: &str,
        company_slug: Option<&str>,
    ) -> Result<SitePageSearchQueries> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/page-search-queries",
                percent_encode(domain_uuid)
            ),
            &[("url", Some(url.to_owned()))],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get one page's Lighthouse scores and timings, newest first, and compare every measured page.
    pub fn get_site_lighthouse_history(
        &self,
        domain_uuid: &str,
        days: Option<i64>,
        url: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteLighthouseHistory> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/lighthouse", percent_encode(domain_uuid)),
            &[
                ("days", days.map(|v| v.to_string())),
                ("url", url.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get the pages a domain's Lighthouse runs measure.
    pub fn get_site_lighthouse_pages(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteLighthousePages> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/lighthouse/pages",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Set up to five extra pages for a domain's Lighthouse runs to measure daily.
    pub fn set_site_lighthouse_pages(
        &self,
        domain_uuid: &str,
        request: &SiteLighthousePagesRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteLighthousePages> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/lighthouse/pages",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }
}
