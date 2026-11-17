"""Site Insights: claim, verify, audit and check the domains a Site serves.

The routes live on the top-level ``/api/v1/site-domains`` surface, not under
``/api/v1/admin``, and answer RFC 9457 problems. Every method takes an optional
``company_slug``: a system administrator names the tenant with it, and any other
credential leaves it unset so the server uses the token's own tenant.
"""

from __future__ import annotations

import json
import urllib.parse
from collections.abc import Mapping, Sequence
from typing import Any, Literal, NotRequired, TypedDict, cast

from .admin_site_insights import (
    SiteIndexNowState,
    SiteIndexNowSubmission,
    SiteLighthouseHistory,
    SitePageCheckResponse,
    SitePageFacts,
    SitePageRecheck,
    SiteProjectContext,
    SiteProjectContextRequest,
    SiteRemedy,
    SiteReport,
    SiteReportShareCreated,
    SiteReportShareList,
    SiteRobotsTestResponse,
    SiteSearchDimension,
    SiteSearchInspection,
    SiteSearchInspectionList,
    SiteSearchRowPage,
    SiteUptimeHistory,
)
from .client import AdminClient, problem_request_error, quote_path

SITE_DOMAINS_PATH = "/site-domains"
SITE_ALERT_DESTINATION_PATH = SITE_DOMAINS_PATH + "/alert-destination"
SITE_PROJECT_CONTEXT_PATH = SITE_DOMAINS_PATH + "/project-context"

# Problem codes a caller branches on through RequestError.code.
# A 409 on request_audit: the tenant has not yet proven control of the domain.
SITE_DOMAIN_NOT_VERIFIED_CODE = "site_domain_not_verified"
# A 409 on connect_search: this deployment has no account or key for the provider.
SITE_SEARCH_NOT_CONFIGURED_CODE = "site_search_not_configured"
# A 404 on disconnect_search: the domain is not connected to that provider.
SITE_SEARCH_CONNECTION_NOT_FOUND_CODE = "site_search_connection_not_found"
# A 400 on get_page_facts, request_page_recheck or check_page: the URL is not on the domain's host.
SITE_PAGE_NOT_ON_DOMAIN_CODE = "site_page_not_on_domain"
# A 429 on request_page_recheck: the domain has used its hourly page rechecks.
SITE_PAGE_RECHECK_LIMIT_CODE = "site_page_recheck_limit"
# A 400 on request_search_inspection: the URL is not an http(s) URL on the domain's host.
SITE_SEARCH_INSPECTION_URL_INVALID_CODE = "site_search_inspection_url_invalid"
# A 409 on request_search_inspection: the domain is unverified or not connected to Google.
SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE = "site_search_inspection_not_connected"
# A 429 on request_search_inspection: the tenant has used its daily URL inspections.
SITE_SEARCH_INSPECTION_LIMIT_CODE = "site_search_inspection_limit"
# A 409 on enable_indexnow: the domain is not verified.
SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE = "site_indexnow_domain_unverified"
# A 409 on verify_indexnow or submit_indexnow: IndexNow is not enabled for the domain.
SITE_INDEXNOW_NOT_ENABLED_CODE = "site_indexnow_not_enabled"
# A 409 on submit_indexnow: the key file is not yet verified.
SITE_INDEXNOW_KEY_UNVERIFIED_CODE = "site_indexnow_key_unverified"
# A 400 on submit_indexnow: urls must be 1 to 100 distinct http(s) URLs on the domain's host.
SITE_INDEXNOW_URLS_INVALID_CODE = "site_indexnow_urls_invalid"
# A 429 on submit_indexnow: the tenant has used its daily IndexNow URLs.
SITE_INDEXNOW_LIMIT_CODE = "site_indexnow_limit"

# SiteFindingState selects which findings list_findings returns; the server defaults to open.
SiteFindingState = Literal["open", "fixed", "all"]
SITE_FINDING_STATE_OPEN: SiteFindingState = "open"
SITE_FINDING_STATE_FIXED: SiteFindingState = "fixed"
SITE_FINDING_STATE_ALL: SiteFindingState = "all"

# SiteCheckMode is how a verified domain is checked. Custd cannot tell that a site is stopped, so
# whoever stops a site sets its domain to paused; nothing then requests it until the mode changes.
SiteCheckMode = Literal["paused", "uptime", "warm"]
# Sends no requests: no uptime, certificate or warming check.
SITE_CHECK_MODE_PAUSED: SiteCheckMode = "paused"
# Checks the home page every five minutes and the certificate every six hours. The default.
SITE_CHECK_MODE_UPTIME: SiteCheckMode = "uptime"
# Adds one anonymous home page GET every minute.
SITE_CHECK_MODE_WARM: SiteCheckMode = "warm"

# SiteUptimeStatus: unknown is no check in the last fifteen minutes; failing is one failed check;
# down is an open incident (two or more failed checks in a row).
SiteUptimeStatus = Literal["unknown", "up", "failing", "down", "paused"]

# SiteDomainVerifiedBy is how a domain's control was proven; parent means a verified parent
# domain covers it (ownership.verifiedViaDomainUuid names it).
SiteDomainVerifiedBy = Literal["dns", "file", "attested", "parent", "operator"]

# SiteSearchProvider is a search engine Custd imports a domain's search numbers from. Google
# imports through Custd's service account, which the client adds as a (Restricted) user on its
# Search Console property; Bing imports with the client's API key.
SiteSearchProvider = Literal["google", "bing"]
SITE_SEARCH_PROVIDER_GOOGLE: SiteSearchProvider = "google"
SITE_SEARCH_PROVIDER_BING: SiteSearchProvider = "bing"

# SiteSearchConnectionStatus: pending is connected but not yet imported; failing is a connection
# whose latest import failed (lastFailure says why); revoked is one the provider no longer allows.
SiteSearchConnectionStatus = Literal["pending", "active", "failing", "revoked"]

# Finding rule IDs, from libs/go/siteaudit in Custd. A finding's ``rule`` is one of these; key
# client behaviour on the ID, never on the title.
SITE_RULE_PAGE_STATUS = "crawl.page-status"
SITE_RULE_REDIRECT_CHAIN = "crawl.redirect-chain"
SITE_RULE_SOFT_404 = "crawl.soft-404"
SITE_RULE_HTTPS_REDIRECT = "host.https-redirect"
SITE_RULE_CANONICAL_HOST = "host.canonical-host"
SITE_RULE_ROBOTS_MISSING = "robots.missing"
SITE_RULE_ROBOTS_INVALID = "robots.invalid"
SITE_RULE_ROBOTS_NO_SITEMAP = "robots.no-sitemap"
SITE_RULE_SITEMAP_MISSING = "sitemap.missing"
SITE_RULE_SITEMAP_INVALID = "sitemap.invalid"
SITE_RULE_SITEMAP_URL_STATUS = "sitemap.url-not-ok"
SITE_RULE_SITEMAP_NOINDEX = "sitemap.noindex-url"
SITE_RULE_SITEMAP_LASTMOD = "sitemap.lastmod-missing"
SITE_RULE_CANONICAL_MISSING = "canonical.missing"
SITE_RULE_CANONICAL_INVALID = "canonical.invalid"
SITE_RULE_CANONICAL_NOT_OK = "canonical.not-ok"
SITE_RULE_TITLE_MISSING = "title.missing"
SITE_RULE_TITLE_LENGTH = "title.length"
SITE_RULE_TITLE_DUPLICATE = "title.duplicate"
SITE_RULE_DESC_MISSING = "description.missing"
SITE_RULE_DESC_LENGTH = "description.length"
SITE_RULE_DESC_DUPLICATE = "description.duplicate"
SITE_RULE_HEADING_H1 = "heading.h1"
SITE_RULE_LANG_MISSING = "html.lang-missing"
SITE_RULE_HTML_TOO_LARGE = "html.too-large"
SITE_RULE_OPEN_GRAPH_MISSING = "og.missing"
SITE_RULE_OPEN_GRAPH_IMAGE_MISSING = "og.image-missing"
SITE_RULE_TWITTER_CARD_MISSING = "twitter.card-missing"
SITE_RULE_IMAGE_ALT_MISSING = "image.alt-missing"
SITE_RULE_IMAGE_TOO_LARGE = "image.too-large"
SITE_RULE_IMAGE_LEGACY_FORMAT = "image.legacy-format"
SITE_RULE_IMAGE_DIMENSIONS = "image.missing-dimensions"
SITE_RULE_IMAGE_NOT_LAZY = "image.not-lazy"
SITE_RULE_NO_COMPRESSION = "http.no-compression"
SITE_RULE_STATIC_CACHE = "cache.static-assets"
SITE_RULE_JS_REQUIRED = "ai.js-required"
SITE_RULE_ANSWER_BOT_BLOCKED = "ai.answer-bot-blocked"
SITE_RULE_TRAINING_BLOCKED = "ai.training-bot-blocked"
SITE_RULE_BOT_REFUSED = "ai.bot-refused"
SITE_RULE_JSONLD_MISSING = "jsonld.missing"
SITE_RULE_JSONLD_INVALID = "jsonld.invalid"
SITE_RULE_JSONLD_NO_ENTITY = "jsonld.no-entity"
SITE_RULE_LLMS_MISSING = "llms.missing"
SITE_RULE_LLMS_INVALID = "llms.invalid"
SITE_RULE_REDIRECT_LOOP = "crawl.redirect-loop"
SITE_RULE_ORPHAN_PAGE = "crawl.orphan-page"
SITE_RULE_DEEP_PAGE = "crawl.deep-page"
SITE_RULE_NO_INTERNAL_LINKS = "crawl.no-internal-links"
SITE_RULE_NOINDEX_PAGE = "crawl.noindex-page"
SITE_RULE_HOME_NOINDEX = "crawl.home-noindex"
SITE_RULE_NOFOLLOW_PAGE = "robots.nofollow"
SITE_RULE_CANONICAL_ELSEWHERE = "canonical.points-elsewhere"
SITE_RULE_CANONICAL_CONFLICT = "canonical.conflict"
SITE_RULE_HEADING_SKIP = "heading.order-skip"
SITE_RULE_THIN_CONTENT = "content.thin"
SITE_RULE_DUPLICATE_CONTENT = "content.duplicate"
SITE_RULE_HREFLANG_INVALID_CODE = "hreflang.invalid-code"
SITE_RULE_HREFLANG_MISSING_SELF = "hreflang.missing-self-reference"
SITE_RULE_HREFLANG_MISSING_RETURN = "hreflang.missing-return-link"
SITE_RULE_HREFLANG_MISSING_X_DEFAULT = "hreflang.missing-x-default"
SITE_RULE_HREFLANG_TARGET_NOT_INDEXABLE = "hreflang.target-not-indexable"
SITE_RULE_SLOW_RESPONSE = "http.slow-response"
SITE_RULE_UPTIME_DOWN = "uptime.down"
SITE_RULE_UPTIME_SLOW = "uptime.slow"
SITE_RULE_TLS_INVALID = "tls.invalid"
SITE_RULE_TLS_EXPIRING = "tls.expiring"
SITE_RULE_TLS_EXPIRING_SOON = "tls.expiring-soon"
SITE_RULE_SEARCH_LOW_CTR = "search.low-ctr"
SITE_RULE_SEARCH_POSITION_DROP = "search.position-drop"
SITE_RULE_LIGHTHOUSE_DESKTOP_DROP = "lighthouse.desktop-score-drop"
SITE_RULE_LIGHTHOUSE_MOBILE_DROP = "lighthouse.mobile-score-drop"

SITE_RULE_IDS: tuple[str, ...] = (
    SITE_RULE_PAGE_STATUS,
    SITE_RULE_REDIRECT_CHAIN,
    SITE_RULE_SOFT_404,
    SITE_RULE_HTTPS_REDIRECT,
    SITE_RULE_CANONICAL_HOST,
    SITE_RULE_ROBOTS_MISSING,
    SITE_RULE_ROBOTS_INVALID,
    SITE_RULE_ROBOTS_NO_SITEMAP,
    SITE_RULE_SITEMAP_MISSING,
    SITE_RULE_SITEMAP_INVALID,
    SITE_RULE_SITEMAP_URL_STATUS,
    SITE_RULE_SITEMAP_NOINDEX,
    SITE_RULE_SITEMAP_LASTMOD,
    SITE_RULE_CANONICAL_MISSING,
    SITE_RULE_CANONICAL_INVALID,
    SITE_RULE_CANONICAL_NOT_OK,
    SITE_RULE_TITLE_MISSING,
    SITE_RULE_TITLE_LENGTH,
    SITE_RULE_TITLE_DUPLICATE,
    SITE_RULE_DESC_MISSING,
    SITE_RULE_DESC_LENGTH,
    SITE_RULE_DESC_DUPLICATE,
    SITE_RULE_HEADING_H1,
    SITE_RULE_LANG_MISSING,
    SITE_RULE_HTML_TOO_LARGE,
    SITE_RULE_OPEN_GRAPH_MISSING,
    SITE_RULE_OPEN_GRAPH_IMAGE_MISSING,
    SITE_RULE_TWITTER_CARD_MISSING,
    SITE_RULE_IMAGE_ALT_MISSING,
    SITE_RULE_IMAGE_TOO_LARGE,
    SITE_RULE_IMAGE_LEGACY_FORMAT,
    SITE_RULE_IMAGE_DIMENSIONS,
    SITE_RULE_IMAGE_NOT_LAZY,
    SITE_RULE_NO_COMPRESSION,
    SITE_RULE_STATIC_CACHE,
    SITE_RULE_JS_REQUIRED,
    SITE_RULE_ANSWER_BOT_BLOCKED,
    SITE_RULE_TRAINING_BLOCKED,
    SITE_RULE_BOT_REFUSED,
    SITE_RULE_JSONLD_MISSING,
    SITE_RULE_JSONLD_INVALID,
    SITE_RULE_JSONLD_NO_ENTITY,
    SITE_RULE_LLMS_MISSING,
    SITE_RULE_LLMS_INVALID,
    SITE_RULE_REDIRECT_LOOP,
    SITE_RULE_ORPHAN_PAGE,
    SITE_RULE_DEEP_PAGE,
    SITE_RULE_NO_INTERNAL_LINKS,
    SITE_RULE_NOINDEX_PAGE,
    SITE_RULE_HOME_NOINDEX,
    SITE_RULE_NOFOLLOW_PAGE,
    SITE_RULE_CANONICAL_ELSEWHERE,
    SITE_RULE_CANONICAL_CONFLICT,
    SITE_RULE_HEADING_SKIP,
    SITE_RULE_THIN_CONTENT,
    SITE_RULE_DUPLICATE_CONTENT,
    SITE_RULE_HREFLANG_INVALID_CODE,
    SITE_RULE_HREFLANG_MISSING_SELF,
    SITE_RULE_HREFLANG_MISSING_RETURN,
    SITE_RULE_HREFLANG_MISSING_X_DEFAULT,
    SITE_RULE_HREFLANG_TARGET_NOT_INDEXABLE,
    SITE_RULE_SLOW_RESPONSE,
    SITE_RULE_UPTIME_DOWN,
    SITE_RULE_UPTIME_SLOW,
    SITE_RULE_TLS_INVALID,
    SITE_RULE_TLS_EXPIRING,
    SITE_RULE_TLS_EXPIRING_SOON,
    SITE_RULE_SEARCH_LOW_CTR,
    SITE_RULE_SEARCH_POSITION_DROP,
    SITE_RULE_LIGHTHOUSE_DESKTOP_DROP,
    SITE_RULE_LIGHTHOUSE_MOBILE_DROP,
)

# The rules the scheduled uptime and TLS checks own; an audit leaves their findings alone.
SITE_CHECK_RULE_IDS: tuple[str, ...] = (
    SITE_RULE_UPTIME_DOWN,
    SITE_RULE_UPTIME_SLOW,
    SITE_RULE_TLS_INVALID,
    SITE_RULE_TLS_EXPIRING,
    SITE_RULE_TLS_EXPIRING_SOON,
)


class SiteDomainCreateRequest(TypedDict):
    """Claims a host for one of the tenant's Sites.

    A site-bound credential (site_domains.manage) may omit ``siteUuid`` and gets its own Site.
    """

    host: str
    siteUuid: NotRequired[str]


class SiteDomainVerification(TypedDict):
    """How to prove control: publish the DNS TXT record or the well-known file. Either is enough."""

    dnsRecordName: str
    dnsRecordValue: str
    fileUrl: str
    fileContent: str


class SiteDomainAttestation(TypedDict):
    """A broker's attestation of the domain; it verifies the domain unless its own proof does."""

    clientId: str
    attestedAt: str


class SiteDomainOwnership(TypedDict):
    """The proof of control and what the last check saw.

    ``verifiedViaDomainUuid`` is the parent domain whose verification covers this one, set only
    when ``verifiedBy`` is ``parent``.
    """

    verified: bool
    instructions: SiteDomainVerification
    verifiedAt: NotRequired[str]
    verifiedBy: NotRequired[SiteDomainVerifiedBy]
    lastCheckedAt: NotRequired[str]
    lastCheckFailure: NotRequired[str]
    verifiedViaDomainUuid: NotRequired[str]
    attestation: NotRequired[SiteDomainAttestation]


class SiteAuditSummary(TypedDict):
    """The findings of one audit run, counted by severity."""

    high: int
    medium: int
    low: int
    info: int
    pagesChecked: int
    requests: int
    truncated: bool


class SiteDomainAudit(TypedDict, total=False):
    """The scheduled audit's state for one domain."""

    requestedAt: str
    lastAuditedAt: str
    lastSummary: SiteAuditSummary
    lastFailure: str


class SiteUptime(TypedDict):
    """The latest home page check."""

    status: SiteUptimeStatus
    consecutiveFailures: int
    lastCheckedAt: NotRequired[str]
    statusCode: NotRequired[int]
    responseMs: NotRequired[int]
    lastFailure: NotRequired[str]


class SiteTLS(TypedDict, total=False):
    """The latest certificate check; ``lastFailure`` says why it is not valid or not reachable."""

    lastCheckedAt: str
    validTo: str
    issuer: str
    lastFailure: str


class SiteWarming(TypedDict, total=False):
    """Average home page response time with warming off and on; each is absent until measured."""

    lastWarmedAt: str
    unwarmedResponseMs: int
    warmedResponseMs: int


class SiteIncident(TypedDict):
    """One outage, from the first failed check to the first that passed; open without resolvedAt."""

    incidentUuid: str
    startedAt: str
    openedAt: str
    cause: str
    failedChecks: int
    resolvedAt: NotRequired[str]


class SiteIncidentList(TypedDict):
    """A domain's recent outages, newest first (at most twenty)."""

    incidents: list[SiteIncident]


class SiteDomainChecks(TypedDict):
    """Uptime, certificate and warming state. Their problems are also uptime.* and tls.* findings."""

    mode: SiteCheckMode
    uptime: SiteUptime
    tls: SiteTLS
    warming: SiteWarming
    openIncident: NotRequired[SiteIncident]


class SiteDomain(TypedDict):
    """A host a Site has claimed. Only a verified domain is audited or checked."""

    domainUuid: str
    siteUuid: str
    host: str
    ownership: SiteDomainOwnership
    audit: SiteDomainAudit
    checks: SiteDomainChecks
    createdAt: str


class SiteDomainList(TypedDict):
    """One Site's domains."""

    domains: list[SiteDomain]


class SiteFindingHistory(TypedDict):
    """When a finding was seen and whether it is fixed."""

    firstSeenAt: str
    lastSeenAt: str
    fixed: bool
    fixedAt: NotRequired[str]


class SiteFinding(TypedDict):
    """One problem an audit or check found, with the advice to fix it and a source to read.

    ``remedy`` says what the fix changes and, for some rules, carries code to copy.
    """

    findingUuid: str
    rule: str
    severity: str
    title: str
    url: str
    evidence: str
    fix: str
    source: str
    remedy: SiteRemedy
    history: SiteFindingHistory


class SiteFindingList(TypedDict):
    """A domain's findings, most severe first."""

    findings: list[SiteFinding]


class SiteAlertDestination(TypedDict):
    """Where one Site's finding and outage alerts go; no emailRecipient means the tenant's own."""

    siteUuid: str
    emailRecipient: NotRequired[str]


class SiteSearchAccount(TypedDict):
    """Which providers this deployment can import from, and the Google account to add as a user."""

    googleConfigured: bool
    bingConfigured: bool
    googleServiceAccountEmail: NotRequired[str]


class SiteSearchConnectionRequest(TypedDict):
    """Connects a domain to one provider.

    ``property`` is ``sc-domain:example.com`` or a URL prefix for Google, and a URL prefix ending
    in ``/`` for Bing. ``apiKey`` is Bing only; it is write-only and never returned.
    """

    property: str
    apiKey: NotRequired[str]


class SiteSearchConnection(TypedDict):
    """One provider connection and its import state; importedThrough is the last day, YYYY-MM-DD."""

    provider: SiteSearchProvider
    property: str
    status: SiteSearchConnectionStatus
    importedThrough: NotRequired[str]
    lastImportedAt: NotRequired[str]
    lastFailure: NotRequired[str]


class SiteSearchTotals(TypedDict):
    """Summed search numbers. ``ctr`` is 0..1; ``position`` is absent when unknown."""

    clicks: int
    impressions: int
    ctr: float
    position: NotRequired[float]


class SiteSearchDay(TypedDict):
    """One imported day's totals; Bing's are week buckets."""

    day: str
    clicks: int
    impressions: int


# "from" is a Python keyword, so the window's optional fields use the functional form.
_SiteSearchSourceWindow = TypedDict(
    "_SiteSearchSourceWindow",
    {"from": str, "to": str, "importedAt": str, "previous": SiteSearchTotals},
    total=False,
)


class SiteSearchSource(_SiteSearchSourceWindow):
    """One provider's totals for the window. ``granularity`` is daily or weekly.

    ``from``/``to`` are the days covered; ``previous`` is the same number of days before the
    window, when imported.
    """

    provider: SiteSearchProvider
    source: str
    granularity: str
    days: int
    totals: SiteSearchTotals
    daily: list[SiteSearchDay]


class SiteSearchRow(TypedDict):
    """One page URL or query text and its totals."""

    provider: SiteSearchProvider
    key: str
    totals: SiteSearchTotals


class SiteSearchPerformance(TypedDict):
    """A domain's imported search numbers over the last ``days`` days."""

    domainUuid: str
    days: int
    connections: list[SiteSearchConnection]
    sources: list[SiteSearchSource]
    topPages: list[SiteSearchRow]
    topQueries: list[SiteSearchRow]
    strikingDistance: list[SiteSearchRow]


class SiteDomainAdminClient:
    """Claims, verifies, audits and checks the domains a Site serves."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def create(self, request: SiteDomainCreateRequest, *, company_slug: str | None = None) -> SiteDomain:
        """Claim a host for a Site and return the verification instructions."""
        payload: dict[str, Any] = {"host": request["host"]}
        if request.get("siteUuid"):
            payload = {"siteUuid": request["siteUuid"], **payload}
        return cast(SiteDomain, self._request("POST", SITE_DOMAINS_PATH, {}, company_slug, payload))

    def list(self, site_uuid: str | None = None, *, company_slug: str | None = None) -> SiteDomainList:
        """Return one Site's domains. A site-bound credential may omit site_uuid for its own Site."""
        query = {"siteUuid": site_uuid} if site_uuid else {}
        return cast(SiteDomainList, self._request("GET", SITE_DOMAINS_PATH, query, company_slug))

    def get(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteDomain:
        return cast(SiteDomain, self._request("GET", _domain_path(domain_uuid), {}, company_slug))

    def verify(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteDomain:
        """Check the DNS record or well-known file now.

        An unproven domain returns with ``ownership.verified`` false and the reason in
        ``ownership.lastCheckFailure``.
        """
        return cast(SiteDomain, self._request("POST", _domain_path(domain_uuid) + "/verify", {}, company_slug))

    def attest(self, domain_uuid: str) -> SiteDomain:
        """Record this credential's attestation that it controls the domain.

        It verifies the domain (verifiedBy ``attested``) and its subdomains. Only a site-bound
        credential holding site_domains.attest may attest its own Site's domains.
        """
        return cast(SiteDomain, self._request("POST", _domain_path(domain_uuid) + "/attestation", {}, None))

    def unattest(self, domain_uuid: str) -> SiteDomain:
        """Withdraw this credential's attestation; the domain stays verified only by its own proof."""
        return cast(SiteDomain, self._request("DELETE", _domain_path(domain_uuid) + "/attestation", {}, None))

    def request_audit(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteDomain:
        """Audit the domain on the scheduler's next tick.

        An unverified domain is refused with a 409 whose code is SITE_DOMAIN_NOT_VERIFIED_CODE.
        """
        return cast(SiteDomain, self._request("POST", _domain_path(domain_uuid) + "/audit", {}, company_slug))

    def list_findings(
        self, domain_uuid: str, state: SiteFindingState | None = None, *, company_slug: str | None = None
    ) -> SiteFindingList:
        """Return a domain's findings in ``state``; omitted, the server returns open findings."""
        query = {"state": state} if state else {}
        return cast(SiteFindingList, self._request("GET", _domain_path(domain_uuid) + "/findings", query, company_slug))

    def delete(self, domain_uuid: str, *, company_slug: str | None = None) -> None:
        """Remove a domain and its findings."""
        self._request("DELETE", _domain_path(domain_uuid), {}, company_slug)

    def set_check_mode(
        self, domain_uuid: str, mode: SiteCheckMode, *, company_slug: str | None = None
    ) -> SiteDomain:
        """Choose how a domain is checked. Works before verification, so a domain can start paused."""
        path = _domain_path(domain_uuid) + "/checks"
        return cast(SiteDomain, self._request("PUT", path, {}, company_slug, {"mode": mode}))

    def list_incidents(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteIncidentList:
        """Return a domain's recent outages, newest first (at most twenty)."""
        path = _domain_path(domain_uuid) + "/incidents"
        return cast(SiteIncidentList, self._request("GET", path, {}, company_slug))

    def get_alert_destination(
        self, site_uuid: str | None = None, *, company_slug: str | None = None
    ) -> SiteAlertDestination:
        """Return a Site's alert address. A site-bound credential may omit site_uuid."""
        query = {"siteUuid": site_uuid} if site_uuid else {}
        return cast(SiteAlertDestination, self._request("GET", SITE_ALERT_DESTINATION_PATH, query, company_slug))

    def set_alert_destination(
        self, email_recipient: str, site_uuid: str | None = None, *, company_slug: str | None = None
    ) -> SiteAlertDestination:
        """Email a Site's alerts to email_recipient; an empty string sends them to the tenant's again."""
        query = {"siteUuid": site_uuid} if site_uuid else {}
        payload = {"emailRecipient": email_recipient}
        result = self._request("PUT", SITE_ALERT_DESTINATION_PATH, query, company_slug, payload)
        return cast(SiteAlertDestination, result)

    def get_search_account(self, *, company_slug: str | None = None) -> SiteSearchAccount:
        """Return which providers this deployment can import from."""
        return cast(SiteSearchAccount, self._request("GET", SITE_DOMAINS_PATH + "/search-account", {}, company_slug))

    def get_search_performance(
        self, domain_uuid: str, days: int | None = None, *, company_slug: str | None = None
    ) -> SiteSearchPerformance:
        """Return a domain's search numbers over the last ``days`` days (1..90); omitted, 28."""
        query = {"days": str(days)} if days else {}
        path = _domain_path(domain_uuid) + "/search"
        return cast(SiteSearchPerformance, self._request("GET", path, query, company_slug))

    def connect_search(
        self,
        domain_uuid: str,
        provider: SiteSearchProvider,
        request: SiteSearchConnectionRequest,
        *,
        company_slug: str | None = None,
    ) -> SiteSearchConnection:
        """Connect a domain to a provider, or replace its property or key.

        A deployment without an account or key for the provider refuses it with a 409 whose code
        is SITE_SEARCH_NOT_CONFIGURED_CODE.
        """
        payload: dict[str, Any] = {"property": request["property"]}
        if request.get("apiKey"):
            payload["apiKey"] = request["apiKey"]
        path = _search_connection_path(domain_uuid, provider)
        return cast(SiteSearchConnection, self._request("PUT", path, {}, company_slug, payload))

    def disconnect_search(
        self, domain_uuid: str, provider: SiteSearchProvider, *, company_slug: str | None = None
    ) -> None:
        """Remove a provider connection and the numbers imported through it.

        A provider that is not connected answers 404 with SITE_SEARCH_CONNECTION_NOT_FOUND_CODE.
        """
        self._request("DELETE", _search_connection_path(domain_uuid, provider), {}, company_slug)

    def get_page_facts(self, domain_uuid: str, url: str, *, company_slug: str | None = None) -> SitePageFacts:
        """Return what the latest audit or recheck read from one page of the domain."""
        path = _domain_path(domain_uuid) + "/page-facts"
        return cast(SitePageFacts, self._request("GET", path, {"url": url}, company_slug))

    def request_page_recheck(
        self, domain_uuid: str, url: str, *, company_slug: str | None = None
    ) -> SitePageRecheck:
        """Queue one page of a verified domain for the scheduler's next tick (202).

        A page already queued is returned as it is. Over the hourly allowance the server answers
        429 with SITE_PAGE_RECHECK_LIMIT_CODE; a URL on another host, SITE_PAGE_NOT_ON_DOMAIN_CODE.
        """
        path = _domain_path(domain_uuid) + "/page-rechecks"
        return cast(SitePageRecheck, self._request("POST", path, {}, company_slug, {"url": url}))

    def get_page_recheck(
        self, domain_uuid: str, recheck_uuid: str, *, company_slug: str | None = None
    ) -> SitePageRecheck:
        path = _domain_path(domain_uuid) + "/page-rechecks/" + quote_path(recheck_uuid)
        return cast(SitePageRecheck, self._request("GET", path, {}, company_slug))

    def check_page(
        self, domain_uuid: str, url: str, html: str, *, company_slug: str | None = None
    ) -> SitePageCheckResponse:
        """Run the one-page checks on draft HTML (at most 512 KiB) as if ``url`` served it.

        The draft is never fetched, stored or logged.
        """
        path = _domain_path(domain_uuid) + "/page-check"
        payload = {"url": url, "html": html}
        return cast(SitePageCheckResponse, self._request("POST", path, {}, company_slug, payload))

    def test_robots(
        self,
        domain_uuid: str,
        url: str,
        user_agent: str,
        robots_txt: str | None = None,
        *,
        company_slug: str | None = None,
    ) -> SiteRobotsTestResponse:
        """Decide whether ``user_agent`` may fetch ``url`` (a path or http(s) URL).

        Without ``robots_txt`` the domain's live robots.txt is read.
        """
        payload: dict[str, Any] = {"url": url, "userAgent": user_agent}
        if robots_txt is not None:
            payload["robotsTxt"] = robots_txt
        path = _domain_path(domain_uuid) + "/robots-test"
        return cast(SiteRobotsTestResponse, self._request("POST", path, {}, company_slug, payload))

    def list_search_rows(
        self,
        domain_uuid: str,
        dimension: SiteSearchDimension | None = None,
        *,
        provider: SiteSearchProvider | None = None,
        days: int | None = None,
        offset: int | None = None,
        limit: int | None = None,
        company_slug: str | None = None,
    ) -> SiteSearchRowPage:
        """Page through one dimension of the domain's search rows.

        The server defaults to the query dimension, every provider, 28 days, offset 0 and 100
        rows (at most 1000). ``unavailable`` names providers that cannot report the dimension.
        """
        query: dict[str, str] = {}
        if dimension:
            query["dimension"] = dimension
        if provider:
            query["provider"] = provider
        for name, value in (("days", days), ("offset", offset), ("limit", limit)):
            if value is not None:
                query[name] = str(value)
        path = _domain_path(domain_uuid) + "/search/rows"
        return cast(SiteSearchRowPage, self._request("GET", path, query, company_slug))

    def list_search_inspections(
        self, domain_uuid: str, *, company_slug: str | None = None
    ) -> SiteSearchInspectionList:
        """Return the domain's latest URL inspections and the tenant's daily use."""
        path = _domain_path(domain_uuid) + "/search/inspections"
        return cast(SiteSearchInspectionList, self._request("GET", path, {}, company_slug))

    def request_search_inspection(
        self, domain_uuid: str, url: str, *, company_slug: str | None = None
    ) -> SiteSearchInspection:
        """Queue a Search Console URL Inspection of one URL on the domain (202).

        The server answers SITE_SEARCH_INSPECTION_URL_INVALID_CODE, _NOT_CONNECTED_CODE or
        _LIMIT_CODE when it refuses.
        """
        path = _domain_path(domain_uuid) + "/search/inspections"
        return cast(SiteSearchInspection, self._request("POST", path, {}, company_slug, {"url": url}))

    def get_project_context(
        self, site_uuid: str | None = None, *, company_slug: str | None = None
    ) -> SiteProjectContext:
        """Return a Site's brands, competitors and markets. A site-bound credential may omit site_uuid."""
        query = {"siteUuid": site_uuid} if site_uuid else {}
        return cast(SiteProjectContext, self._request("GET", SITE_PROJECT_CONTEXT_PATH, query, company_slug))

    def set_project_context(
        self,
        request: SiteProjectContextRequest,
        site_uuid: str | None = None,
        *,
        company_slug: str | None = None,
    ) -> SiteProjectContext:
        """Replace a Site's project context; every list is sent, so an omitted one is cleared."""
        query = {"siteUuid": site_uuid} if site_uuid else {}
        payload: dict[str, Any] = {
            "brandNames": list(request.get("brandNames", [])),
            "competitorDomains": list(request.get("competitorDomains", [])),
            "markets": [
                {"country": market["country"], "language": market["language"]}
                for market in request.get("markets", [])
            ],
        }
        result = self._request("PUT", SITE_PROJECT_CONTEXT_PATH, query, company_slug, payload)
        return cast(SiteProjectContext, result)

    def get_report(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteReport:
        """Return the client report, without private verification or connection details."""
        return cast(SiteReport, self._request("GET", _domain_path(domain_uuid) + "/report", {}, company_slug))

    def get_uptime_history(
        self, domain_uuid: str, response_days: int | None = None, *, company_slug: str | None = None
    ) -> SiteUptimeHistory:
        """Return uptime windows, ninety daily bars and hourly response times (response_days 1..90)."""
        query = {"responseDays": str(response_days)} if response_days is not None else {}
        path = _domain_path(domain_uuid) + "/uptime-history"
        return cast(SiteUptimeHistory, self._request("GET", path, query, company_slug))

    def get_lighthouse_history(
        self, domain_uuid: str, days: int | None = None, *, company_slug: str | None = None
    ) -> SiteLighthouseHistory:
        """Return scheduled desktop and mobile lab runs over 1..30 days; omitted, seven."""
        query = {"days": str(days)} if days is not None else {}
        path = _domain_path(domain_uuid) + "/lighthouse"
        return cast(SiteLighthouseHistory, self._request("GET", path, query, company_slug))

    def list_report_shares(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteReportShareList:
        """Return the live report shares; tokens are returned only on creation."""
        path = _domain_path(domain_uuid) + "/report-shares"
        return cast(SiteReportShareList, self._request("GET", path, {}, company_slug))

    def create_report_share(
        self, domain_uuid: str, expires_in_days: int = 30, *, company_slug: str | None = None
    ) -> SiteReportShareCreated:
        """Create a public report share lasting 1..90 days. Copy the token once; never retried."""
        path = _domain_path(domain_uuid) + "/report-shares"
        payload = {"expiresInDays": expires_in_days}
        return cast(SiteReportShareCreated, self._request("POST", path, {}, company_slug, payload))

    def revoke_report_share(self, domain_uuid: str, share_uuid: str, *, company_slug: str | None = None) -> None:
        """Revoke a share; later public reads of it fail."""
        path = _domain_path(domain_uuid) + "/report-shares/" + quote_path(share_uuid)
        self._request("DELETE", path, {}, company_slug)

    def get_indexnow(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteIndexNowState:
        """Return the domain's IndexNow key, verification and recent submissions."""
        return cast(SiteIndexNowState, self._request("GET", _indexnow_path(domain_uuid), {}, company_slug))

    def enable_indexnow(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteIndexNowState:
        """Enable IndexNow for a verified domain; the result names the key file to host."""
        return cast(SiteIndexNowState, self._request("PUT", _indexnow_path(domain_uuid), {}, company_slug))

    def disable_indexnow(self, domain_uuid: str, *, company_slug: str | None = None) -> None:
        """Disable IndexNow for the domain."""
        self._request("DELETE", _indexnow_path(domain_uuid), {}, company_slug)

    def verify_indexnow(self, domain_uuid: str, *, company_slug: str | None = None) -> SiteIndexNowState:
        """Check the hosted key file now; a failed check returns with ``lastCheckFailure`` set."""
        path = _indexnow_path(domain_uuid) + "/verify"
        return cast(SiteIndexNowState, self._request("POST", path, {}, company_slug))

    def submit_indexnow(
        self, domain_uuid: str, urls: Sequence[str], *, company_slug: str | None = None
    ) -> SiteIndexNowSubmission:
        """Queue 1 to 100 URLs on the domain's host for IndexNow (202)."""
        path = _indexnow_path(domain_uuid) + "/submissions"
        return cast(SiteIndexNowSubmission, self._request("POST", path, {}, company_slug, {"urls": list(urls)}))

    def _request(
        self,
        method: str,
        path: str,
        query: Mapping[str, str],
        company_slug: str | None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if company_slug:
            query = {**query, "companySlug": company_slug}
        url = self._admin._client.base_url + "/api/v1" + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        client = self._admin._client
        result = self._admin._transport(method, url, payload, client._headers(), client.timeout)
        status = int(result["status"])
        body = result.get("body")
        if status >= 400:
            raise problem_request_error(status, body, "site domain")
        if status == 204 or body in (None, ""):
            return {}
        decoded = json.loads(body) if isinstance(body, str) else body
        if not isinstance(decoded, Mapping):
            raise ValueError("custd: site domain response must be a JSON object")
        return dict(decoded)


def _domain_path(domain_uuid: str) -> str:
    return SITE_DOMAINS_PATH + "/" + quote_path(domain_uuid)


def _search_connection_path(domain_uuid: str, provider: SiteSearchProvider) -> str:
    return _domain_path(domain_uuid) + "/search/" + quote_path(provider)


def _indexnow_path(domain_uuid: str) -> str:
    return _domain_path(domain_uuid) + "/indexnow"
