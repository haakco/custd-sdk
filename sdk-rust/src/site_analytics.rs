//! A domain's analytics and AI: the GA4 connection, traffic, AI visibility and the tenant's AI settings and usage.
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
pub struct SiteAnalyticsReport {
    /// Sessions by default channel group, all traffic.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub channels: Vec<SiteAnalyticsRow>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub connection: Option<SiteAnalyticsConnection>,
    pub domain_uuid: String,
    /// Organic Search key events by event name.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub key_events: Vec<SiteAnalyticsRow>,
    /// False with no organic key event; key events are absent.
    pub key_events_recorded: bool,
    /// Organic Search sessions by landing page, busiest first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub landing_pages: Vec<SiteAnalyticsRow>,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub unavailable: Vec<SiteAnalyticsUnavailable>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub window_from: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub window_to: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAnalyticsRow {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub engaged_sessions: Option<i64>,
    /// The landing page path, key event name or channel group.
    pub key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key_events: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sessions: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAnalyticsConnection {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_failure: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_imported_at: Option<String>,
    pub property_id: String,
    pub provider: SiteAnalyticsConnectionProvider,
    pub status: SiteAnalyticsConnectionStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAnalyticsUnavailable {
    pub reason: String,
    pub report: SiteAnalyticsUnavailableReport,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAnalyticsConnectionRequest {
    /// The GA4 property's numeric ID, as GA4's Property details show it; properties/ID is accepted.
    pub property_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTraffic {
    #[serde(default, deserialize_with = "null_as_empty")]
    pub countries: Vec<SiteTrafficCount>,
    pub coverage: SiteTrafficCoverage,
    /// Crawler requests, verified apart from claims to be.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub crawlers: Vec<SiteTrafficCrawler>,
    /// Every day of the range, oldest first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub days: Vec<SiteTrafficDay>,
    pub domain_uuid: String,
    /// First UTC day, YYYY-MM-DD.
    pub from: String,
    pub generated_at: String,
    /// The most requested paths that answered 404.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub not_found_paths: Vec<SiteTrafficCount>,
    /// Referred requests by class; empty when none was recorded.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub referrer_classes: Vec<SiteTrafficReferrerClass>,
    /// The external referrer domains with the most requests.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub referrers: Vec<SiteTrafficReferrer>,
    /// The paths with the slowest p95, from each day's slowest.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub slow_paths: Vec<SiteTrafficSlowPath>,
    /// Requests by 2xx, 3xx, 4xx, 5xx and other.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub status_classes: Vec<SiteTrafficCount>,
    /// Last UTC day, YYYY-MM-DD.
    pub to: String,
    /// Absent when no hour of the range was read.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub totals: Option<SiteTrafficTotals>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficCount {
    /// (other) collects the rest beyond each day's top rows.
    pub key: String,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficCoverage {
    /// Every expected hour was read whole.
    pub complete: bool,
    pub hours_expected: i64,
    /// Hours whose read failed; they are retried.
    pub hours_failed: i64,
    /// Hours not read yet, or read before the domain was added.
    pub hours_missing: i64,
    /// Hours read in part (a line cap or read budget); their numbers are a lower bound.
    pub hours_partial: i64,
    /// Hours read whole.
    pub hours_read: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficCrawler {
    /// The crawler fetches pages for an AI assistant or its training.
    pub ai: bool,
    /// Crawler slug, such as googlebot or gptbot; other-bot is any other self-declared bot.
    pub crawler: String,
    pub identity: SiteTrafficCrawlerIdentity,
    /// Requests answered 404.
    pub not_found: i64,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficDay {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bytes: Option<i64>,
    pub coverage: SiteTrafficDayCoverage,
    /// UTC day, YYYY-MM-DD.
    pub date: String,
    pub hours_failed: i64,
    pub hours_missing: i64,
    pub hours_partial: i64,
    pub hours_read: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub not_found: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requests: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficReferrerClass {
    pub class: SiteTrafficClass,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficReferrer {
    pub class: SiteTrafficClass,
    pub domain: String,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficSlowPath {
    pub max_ms: i64,
    pub p95_ms: i64,
    pub path: String,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteTrafficTotals {
    pub bytes: i64,
    /// Requests answered 404.
    pub not_found: i64,
    /// 95th percentile response time; absent without a request.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p95_ms: Option<i64>,
    pub requests: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIVisibility {
    /// Latest provider sample, independent of the date range.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub answer_sample: Option<SiteAIAnswerSample>,
    /// Referral visits by AI-assistant domain.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub assistants: Vec<SiteTrafficCount>,
    pub coverage: SiteTrafficCoverage,
    /// AI-crawler requests, verified apart from claims to be.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub crawlers: Vec<SiteTrafficCrawler>,
    pub domain_uuid: String,
    /// First UTC day, YYYY-MM-DD.
    pub from: String,
    pub generated_at: String,
    /// Pages with an AI-crawler request or an AI-assistant referral, busiest first.
    #[serde(default, deserialize_with = "null_as_empty")]
    pub pages: Vec<SiteAIPage>,
    /// The Site; its browser-tracker AI referrals are read from reporting by this id.
    pub site_uuid: String,
    /// Last UTC day, YYYY-MM-DD.
    pub to: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIAnswerSample {
    /// AI-generated model text. An omitted answer means no answer was received.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub answer: Option<String>,
    pub observed_at: String,
    pub product: SiteAIAnswerSampleProduct,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIPage {
    /// Requests from a User-Agent claiming an AI crawler that DNS did not confirm.
    pub claimed_crawler_hits: i64,
    /// (other) collects the pages beyond each day's top rows.
    pub path: String,
    /// Requests referred by an AI assistant, from the access logs.
    pub referral_visits: i64,
    pub verified_crawler_hits: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAISettings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accepted_terms_version: Option<String>,
    pub ai_mode: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub consent_accepted_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub current_terms_version: Option<String>,
    pub key_configured: bool,
    /// DeepSeek refused the key or its balance. Replace the key.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub key_refused: Option<bool>,
    pub monthly_cap_usd_micros: i64,
    /// This deployment can store and validate a customer key.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub own_key_available: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAITenantUsage {
    pub ai_mode: String,
    pub from: String,
    pub monthly_cap_usd_micros: i64,
    /// Usage counted toward the active monthly cap.
    pub monthly_cap_used_usd_micros: i64,
    pub period: String,
    #[serde(default, deserialize_with = "null_as_empty")]
    pub rows: Vec<SiteAIUsageRow>,
    pub until: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIUsageRow {
    pub attempts: i64,
    pub audio_milliseconds: i64,
    pub cached_input_tokens: i64,
    pub cap_accounted_usd_micros: i64,
    pub confirmed_cost_usd_micros: i64,
    pub estimated_cost_usd_micros: i64,
    pub failed_attempts: i64,
    pub feature: String,
    pub input_tokens: i64,
    pub method: String,
    pub model: String,
    pub not_sent_attempts: i64,
    pub output_tokens: i64,
    pub pages: i64,
    pub payer: String,
    pub price_revision: String,
    pub provider: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sampling_product: Option<SiteAIAnswerSampleProduct>,
    pub searches: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tenant_slug: Option<String>,
    pub unknown_cost_attempts: i64,
    pub unsettled_attempts: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAISettingsRequest {
    pub ai_mode: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    pub monthly_cap_usd_micros: i64,
}

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteAIConsentRequest {
    pub action: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub terms_version: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAnalyticsConnectionProvider {
    #[serde(rename = "ga4")]
    Ga4,
}

impl SiteAnalyticsConnectionProvider {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ga4 => "ga4",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAnalyticsConnectionStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "failing")]
    Failing,
    #[serde(rename = "revoked")]
    Revoked,
}

impl SiteAnalyticsConnectionStatus {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Active => "active",
            Self::Failing => "failing",
            Self::Revoked => "revoked",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAnalyticsUnavailableReport {
    #[serde(rename = "ecommerce")]
    Ecommerce,
    #[serde(rename = "audience")]
    Audience,
}

impl SiteAnalyticsUnavailableReport {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Ecommerce => "ecommerce",
            Self::Audience => "audience",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTrafficCrawlerIdentity {
    #[serde(rename = "verified")]
    Verified,
    #[serde(rename = "claims_to_be")]
    ClaimsToBe,
}

impl SiteTrafficCrawlerIdentity {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Verified => "verified",
            Self::ClaimsToBe => "claims_to_be",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTrafficDayCoverage {
    #[serde(rename = "complete")]
    Complete,
    #[serde(rename = "partial")]
    Partial,
    #[serde(rename = "missing")]
    Missing,
}

impl SiteTrafficDayCoverage {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Complete => "complete",
            Self::Partial => "partial",
            Self::Missing => "missing",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteTrafficClass {
    #[serde(rename = "search")]
    Search,
    #[serde(rename = "ai")]
    Ai,
    #[serde(rename = "social")]
    Social,
    #[serde(rename = "other")]
    Other,
}

impl SiteTrafficClass {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Search => "search",
            Self::Ai => "ai",
            Self::Social => "social",
            Self::Other => "other",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SiteAIAnswerSampleProduct {
    #[serde(rename = "hosting")]
    Hosting,
    #[serde(rename = "custd")]
    Custd,
    #[serde(rename = "cb")]
    Cb,
    #[serde(rename = "awthy")]
    Awthy,
}

impl SiteAIAnswerSampleProduct {
    /// The wire value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Hosting => "hosting",
            Self::Custd => "custd",
            Self::Cb => "cb",
            Self::Awthy => "awthy",
        }
    }
}

impl CustdClient {
    /// Get a domain's GA4 organic landing pages, key events and channels.
    pub fn get_site_analytics(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<SiteAnalyticsReport> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/analytics", percent_encode(domain_uuid)),
            &[],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Connect a domain to its GA4 property.
    pub fn connect_site_analytics(
        &self,
        domain_uuid: &str,
        request: &SiteAnalyticsConnectionRequest,
        company_slug: Option<&str>,
    ) -> Result<SiteAnalyticsConnection> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/analytics/ga4",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Put, &path, Some(request))
    }

    /// Disconnect a domain's GA4 property and delete its imported rows.
    pub fn disconnect_site_analytics(
        &self,
        domain_uuid: &str,
        company_slug: Option<&str>,
    ) -> Result<()> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/analytics/ga4",
                percent_encode(domain_uuid)
            ),
            &[],
            company_slug,
        );
        self.call(Method::Delete, &path, NO_BODY)
    }

    /// Get a domain's access-log traffic, errors, referrers and crawlers over a range of days.
    pub fn get_site_traffic(
        &self,
        domain_uuid: &str,
        from: Option<&str>,
        to: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteTraffic> {
        let path = api_path(
            format!("{SITE_DOMAINS}/{}/traffic", percent_encode(domain_uuid)),
            &[
                ("from", from.map(str::to_owned)),
                ("to", to.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Get a domain's AI-crawler requests and AI-assistant referrals per page over a range of days.
    pub fn get_site_ai_visibility(
        &self,
        domain_uuid: &str,
        from: Option<&str>,
        to: Option<&str>,
        company_slug: Option<&str>,
    ) -> Result<SiteAIVisibility> {
        let path = api_path(
            format!(
                "{SITE_DOMAINS}/{}/ai-visibility",
                percent_encode(domain_uuid)
            ),
            &[
                ("from", from.map(str::to_owned)),
                ("to", to.map(str::to_owned)),
            ],
            company_slug,
        );
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the tenant's Site Insights AI settings.
    pub fn get_site_ai_settings(&self) -> Result<SiteAISettings> {
        let path = api_path(format!("{SITE_DOMAINS}/ai-settings"), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Read the tenant's current month of Site Insights AI usage.
    pub fn get_site_ai_tenant_usage(&self) -> Result<SiteAITenantUsage> {
        let path = api_path(format!("{SITE_DOMAINS}/ai-usage"), &[], None);
        self.call(Method::Get, &path, NO_BODY)
    }

    /// Replace the tenant's Site Insights AI mode and cap.
    pub fn set_site_ai_settings(&self, request: &SiteAISettingsRequest) -> Result<SiteAISettings> {
        let path = api_path(format!("{SITE_DOMAINS}/ai-settings"), &[], None);
        self.call(Method::Put, &path, Some(request))
    }

    /// Grant or revoke the tenant's Site Insights AI consent.
    pub fn set_site_ai_consent(&self, request: &SiteAIConsentRequest) -> Result<SiteAISettings> {
        let path = api_path(format!("{SITE_DOMAINS}/ai-settings/consent"), &[], None);
        self.call(Method::Put, &path, Some(request))
    }
}
