"""Site Insights response and request shapes beyond domains: page tools, search rows, URL
inspections, project context and the client report.

Every shape is the admin-api's own JSON. A field the server omits (an unmeasured score, an
unchecked time, a pasted robots file's status) is absent from the dict, never 0.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict

from .admin_site_next_actions import SiteNextAction

if TYPE_CHECKING:
    # admin_site_domains imports this module for its client's return types, so the shared
    # shapes are referenced only in (postponed) annotations.
    from .admin_site_domains import (
        SiteAuditSummary,
        SiteFinding,
        SiteSearchProvider,
        SiteSearchRow,
        SiteSearchSource,
        SiteUptimeStatus,
    )

# What a finding's fix changes. The server may add kinds, and a rule without a remedy shape
# sends an empty kind, so these are plain strings rather than a closed type.
SITE_REMEDY_KIND_MARKUP = "markup"
SITE_REMEDY_KIND_SETTING = "setting"
SITE_REMEDY_KIND_CONTENT = "content"
SITE_REMEDY_KIND_SERVER = "server"

# The formats a remedy's generated code comes in.
SITE_GENERATED_FORMAT_HTML = "html"
SITE_GENERATED_FORMAT_ROBOTS_TXT = "robots.txt"
# One Apache line and one nginx line.
SITE_GENERATED_FORMAT_REDIRECT = "redirect"

# SitePageRecheckState: queued until the scheduler's next tick, then checked or failed.
SitePageRecheckState = Literal["queued", "checked", "failed"]
SITE_PAGE_RECHECK_QUEUED: SitePageRecheckState = "queued"
SITE_PAGE_RECHECK_CHECKED: SitePageRecheckState = "checked"
SITE_PAGE_RECHECK_FAILED: SitePageRecheckState = "failed"

# SiteRobotsSource: pasted when the request carried robotsTxt, live when the domain's own was read.
SiteRobotsSource = Literal["pasted", "live"]
SITE_ROBOTS_SOURCE_PASTED: SiteRobotsSource = "pasted"
SITE_ROBOTS_SOURCE_LIVE: SiteRobotsSource = "live"

# SiteSearchDimension is what one search rows read groups by; the server defaults to query.
SiteSearchDimension = Literal["page", "query", "country", "device"]
SITE_SEARCH_DIMENSION_PAGE: SiteSearchDimension = "page"
SITE_SEARCH_DIMENSION_QUERY: SiteSearchDimension = "query"
SITE_SEARCH_DIMENSION_COUNTRY: SiteSearchDimension = "country"
SITE_SEARCH_DIMENSION_DEVICE: SiteSearchDimension = "device"

# SiteSearchInspectionStatus: queued until the scheduler asks Google, then done or failed.
SiteSearchInspectionStatus = Literal["queued", "done", "failed"]
SITE_SEARCH_INSPECTION_QUEUED: SiteSearchInspectionStatus = "queued"
SITE_SEARCH_INSPECTION_DONE: SiteSearchInspectionStatus = "done"
SITE_SEARCH_INSPECTION_FAILED: SiteSearchInspectionStatus = "failed"

# SiteIndexNowStatus: queued until the scheduler submits it; then IndexNow accepted or rejected
# it, or it failed after its retries.
SiteIndexNowStatus = Literal["queued", "accepted", "rejected", "failed"]
SITE_INDEXNOW_QUEUED: SiteIndexNowStatus = "queued"
SITE_INDEXNOW_ACCEPTED: SiteIndexNowStatus = "accepted"
SITE_INDEXNOW_REJECTED: SiteIndexNowStatus = "rejected"
SITE_INDEXNOW_FAILED: SiteIndexNowStatus = "failed"

SiteLighthouseProfile = Literal["desktop", "mobile"]
SiteLighthouseOutcome = Literal["success", "failed"]

# How many extra pages beyond the home page a domain may run Lighthouse on.
SITE_LIGHTHOUSE_MAX_EXTRA_PAGES = 5

# An audited page's indexability. The server may add values: compare, never reject.
SITE_INDEXABILITY_INDEXABLE = "indexable"
SITE_INDEXABILITY_NOINDEX = "noindex"
SITE_INDEXABILITY_CANONICALIZED = "canonicalized"
SITE_INDEXABILITY_REDIRECTED = "redirected"
SITE_INDEXABILITY_ERROR = "error"
SITE_INDEXABILITY_NOT_HTML = "not_html"

# list_audit_pages paging: the server returns 50 pages by default and at most 200.
SITE_AUDIT_PAGES_DEFAULT_LIMIT = 50
SITE_AUDIT_PAGES_MAX_LIMIT = 200

# How the audit the delta compares stood: never run, failed, stopped at its bound, or whole.
SITE_AUDIT_RUN_NOT_AUDITED = "not_audited"
SITE_AUDIT_RUN_FAILED = "failed"
SITE_AUDIT_RUN_TRUNCATED = "truncated"
SITE_AUDIT_RUN_COMPLETE = "complete"

# SiteReportTemplate picks a report's contents: executive is the short client summary, full
# (the default) is every section.
SiteReportTemplate = Literal["executive", "full"]
SITE_REPORT_TEMPLATE_EXECUTIVE: SiteReportTemplate = "executive"
SITE_REPORT_TEMPLATE_FULL: SiteReportTemplate = "full"

# How many saved reports a domain keeps.
SITE_MAX_SAVED_REPORTS = 20


class SiteGeneratedFix(TypedDict):
    """Ready-to-copy code for one finding; never a published change."""

    format: str
    code: str


class SiteRemedy(TypedDict):
    """What a finding's fix changes; ``generated`` is present only when the rule has a generator.

    A rule without a remedy shape sends an empty ``kind`` and ``element``.
    """

    kind: str
    element: str
    generated: NotRequired[SiteGeneratedFix]


class SitePageFinding(TypedDict):
    """One finding of a draft check: the page's own problems, without an identity or history."""

    rule: str
    severity: str
    title: str
    url: str
    evidence: str
    fix: str
    source: str
    remedy: SiteRemedy


class SitePageRobots(TypedDict):
    """The page's robots meta and its X-Robots-Tag header, empty when absent."""

    noindex: bool
    nofollow: bool
    header: str


class SitePageOpenGraph(TypedDict):
    title: str
    description: str
    image: str
    url: str
    type: str
    siteName: str


class SitePageTwitter(TypedDict):
    card: str
    title: str
    description: str
    image: str
    site: str


class SiteHreflangLink(TypedDict):
    code: str
    href: str


class SitePageHeading(TypedDict):
    level: int
    text: str


class SitePageReadability(TypedDict):
    """Sentence and reading-time counts; ``fleschReadingEase`` is present only for English text."""

    sentences: int
    wordsPerSentence: float
    readingTimeSeconds: int
    fleschReadingEase: NotRequired[float]


class SitePageFacts(TypedDict):
    """What the latest audit, recheck or draft check read from one page.

    ``shareImage`` is the og:image a fix would name (the largest declared image, else the first
    unsized one; never fetched). ``faqSchema`` is FAQPage JSON-LD from the page's question
    headings; Google shows no FAQ rich results since 7 May 2026. Both are absent from older servers.
    """

    url: str
    observedAt: str
    status: int
    lang: str
    title: str
    description: str
    canonical: str
    robots: SitePageRobots
    openGraph: SitePageOpenGraph
    twitter: SitePageTwitter
    hreflang: list[SiteHreflangLink]
    headings: list[SitePageHeading]
    wordCount: int
    readability: SitePageReadability
    shareImage: NotRequired[str]
    faqSchema: NotRequired[SiteGeneratedFix]


class SitePageRecheck(TypedDict):
    """One queued page recheck and, once checked, the one-page rules it opened and fixed."""

    recheckUuid: str
    url: str
    state: SitePageRecheckState
    requestedAt: str
    checkedAt: NotRequired[str]
    failure: NotRequired[str]
    openRules: list[str]
    fixedRules: list[str]


class SitePageRecheckList(TypedDict):
    """The rechecks list_page_rechecks found, in the order asked."""

    rechecks: list[SitePageRecheck]


class SitePhraseUse(TypedDict):
    """Where one phrase appears in a draft and how often, with no target or verdict.

    ``densityPercent`` is count over wordCount as a percentage, absent when the draft has no words.
    """

    phrase: str
    inTitle: bool
    inDescription: bool
    inH1: bool
    count: int
    wordCount: int
    densityPercent: NotRequired[float]


# How much of a page a draft is: the whole page (the server's default) or only its body content,
# for an editor that owns the body and not the head.
SITE_PAGE_CHECK_SCOPE_PAGE = "page"
SITE_PAGE_CHECK_SCOPE_CONTENT = "content"


class SitePageCheckResponse(TypedDict):
    """What the page checks found on draft HTML: the page's facts and its own findings.

    The draft tools are absent unless asked for: ``slug`` from the draft's first h1, else its
    title; ``redirect`` from previous_url (format SITE_GENERATED_FORMAT_REDIRECT); ``phrase``.
    ``scope`` echoes the requested scope. ``checkedRules`` is set only for the content scope: the
    rules checked, so a rule listed there and absent from ``findings`` passed; head rules are not
    among them.
    """

    page: SitePageFacts
    findings: list[SitePageFinding]
    slug: NotRequired[str]
    redirect: NotRequired[SiteGeneratedFix]
    phrase: NotRequired[SitePhraseUse]
    scope: NotRequired[str]
    checkedRules: NotRequired[list[str]]


class SiteWordingCompare(TypedDict):
    """How much wording two texts share, measured as the content.near-duplicate rule does.

    It is wording overlap, not plagiarism. Texts under ``minWords`` are not compared:
    ``compared`` is False and ``sharedPercent`` absent.
    """

    firstWords: int
    secondWords: int
    minWords: int
    compared: bool
    sharedPercent: NotRequired[int]
    thresholdPercent: int
    nearDuplicate: bool


WordingObservationState = Literal["unread", "unavailable", "short", "ready"]


class SiteWordingObservation(TypedDict):
    """Availability and time of the latest checked copy of a page."""

    state: WordingObservationState
    observedAt: NotRequired[str]


class SiteObservedWording(TypedDict):
    """Wording overlap of two saved observations. Comparison is absent if either is unavailable."""

    first: SiteWordingObservation
    second: SiteWordingObservation
    comparison: NotRequired[SiteWordingCompare]


class SiteRobotsRule(TypedDict):
    """The robots.txt rule that decided, by its line number from 1."""

    line: int
    directive: Literal["allow", "disallow"]
    pattern: str


class SiteRobotsTestResponse(TypedDict):
    """Whether a crawler may fetch a path under RFC 9309.

    ``robotsStatus`` is the live file's HTTP status, absent when pasted or unreachable; ``rule``
    is absent when no rule matched; ``note`` says why a live file decided without a rule.
    """

    allowed: bool
    userAgent: str
    path: str
    source: SiteRobotsSource
    groups: list[str]
    robotsStatus: NotRequired[int]
    rule: NotRequired[SiteRobotsRule]
    note: NotRequired[str]


class SiteSearchUnavailable(TypedDict):
    """A provider that cannot report the read dimension: missing rows here are not zero traffic."""

    provider: SiteSearchProvider
    reason: str


class SiteSearchRowPage(TypedDict):
    """One page of a domain's imported search rows for one dimension; ``total`` is before paging."""

    domainUuid: str
    dimension: SiteSearchDimension
    provider: NotRequired[SiteSearchProvider]
    days: int
    offset: int
    limit: int
    total: int
    rows: list[SiteSearchRow]
    unavailable: list[SiteSearchUnavailable]


class SiteSearchInspection(TypedDict):
    """One URL Inspection; every result field is Google's own value and absent when not reported."""

    inspectionUuid: str
    url: str
    status: SiteSearchInspectionStatus
    requestedAt: str
    inspectedAt: NotRequired[str]
    failure: NotRequired[str]
    verdict: NotRequired[str]
    coverageState: NotRequired[str]
    indexingState: NotRequired[str]
    robotsTxtState: NotRequired[str]
    pageFetchState: NotRequired[str]
    lastCrawlAt: NotRequired[str]
    googleCanonical: NotRequired[str]
    userCanonical: NotRequired[str]
    crawledAs: NotRequired[str]
    mobileUsabilityVerdict: NotRequired[str]
    resultLink: NotRequired[str]


class SiteSearchInspectionList(TypedDict):
    """A domain's latest inspections and the tenant's use of its daily limit."""

    inspections: list[SiteSearchInspection]
    dailyLimit: int
    usedToday: int


class SiteMarket(TypedDict):
    """An ISO 3166-1 alpha-2 country (``ZA``) and an ISO 639 language (``en``)."""

    country: str
    language: str


class SiteProjectContextRequest(TypedDict):
    """Replaces a Site's project context: up to 5 brand names, 10 competitor hosts and 10 markets."""

    brandNames: list[str]
    competitorDomains: list[str]
    markets: list[SiteMarket]
    hackerNewsEnabled: NotRequired[bool]


class SiteProjectContext(TypedDict):
    """One Site's brands, named competitors and markets; ``updatedAt`` is absent until first set."""

    siteUuid: str
    brandNames: list[str]
    competitorDomains: list[str]
    markets: list[SiteMarket]
    updatedAt: NotRequired[str]
    hackerNewsEnabled: NotRequired[bool]


class SiteUptimeWindow(TypedDict):
    """Checks in one window; ``upPercent`` is absent when there were none."""

    checks: int
    upChecks: int
    upPercent: NotRequired[float]


class SiteUptimeWindows(TypedDict):
    last24h: SiteUptimeWindow
    last7d: SiteUptimeWindow
    last30d: SiteUptimeWindow


class SiteUptimeDay(TypedDict):
    """One UTC day, YYYY-MM-DD; ``upPercent`` is absent on a day without checks."""

    date: str
    checks: int
    upChecks: int
    upPercent: NotRequired[float]


class SiteResponseHour(TypedDict):
    """One hour's checks; the response times are absent when no check answered."""

    hourStart: str
    checks: int
    upChecks: int
    avgMs: NotRequired[int]
    maxMs: NotRequired[int]


class SiteUptimeHistory(TypedDict):
    """Uptime windows, ninety daily bars and hourly response times over ``responseDays`` days."""

    domainUuid: str
    generatedAt: str
    responseDays: int
    windows: SiteUptimeWindows
    days: list[SiteUptimeDay]
    hours: list[SiteResponseHour]
    monitoredSince: NotRequired[str]


class SiteLighthouseScores(TypedDict, total=False):
    """Category scores 0..100; each is absent when the run did not measure it."""

    performance: int
    accessibility: int
    bestPractices: int
    seo: int


class SiteLighthouseMetrics(TypedDict, total=False):
    """Lab metrics; each is absent when the run did not measure it."""

    firstContentfulPaintMs: int
    largestContentfulPaintMs: int
    totalBlockingTimeMs: int
    speedIndexMs: int
    cumulativeLayoutShift: float


class SiteLighthouseRun(TypedDict):
    """One scheduled lab run; a failed run has ``failure`` and empty scores and metrics."""

    profile: SiteLighthouseProfile
    observedAt: str
    outcome: SiteLighthouseOutcome
    url: str
    durationMs: int
    scores: SiteLighthouseScores
    metrics: SiteLighthouseMetrics
    failure: NotRequired[str]
    toolVersion: NotRequired[str]


class SiteLighthousePageComparison(TypedDict):
    """One page and profile's latest performance score against the run before it.

    ``previousAt`` and ``previousScore`` are absent until a second run.
    """

    url: str
    profile: SiteLighthouseProfile
    latestAt: str
    latestScore: int
    regressionOpen: bool
    previousAt: NotRequired[str]
    previousScore: NotRequired[int]


class SiteLighthouseHistory(TypedDict):
    """The runs of ``url`` (the home page unless an extra page was asked for) and every page's latest score.

    ``url`` and ``pages`` are absent on servers before extra Lighthouse pages; an absent ``pages``
    means no page comparisons.
    """

    domainUuid: str
    days: int
    runs: list[SiteLighthouseRun]
    url: NotRequired[str]
    pages: NotRequired[list[SiteLighthousePageComparison]]


class SiteLighthousePages(TypedDict):
    """The extra pages Lighthouse runs on beyond ``homePage``, at most ``maxPages``."""

    domainUuid: str
    homePage: str
    urls: list[str]
    maxPages: int


class SiteAuditPage(TypedDict):
    """One crawled URL of the latest audit.

    ``status`` is 0 when the request failed. ``depth`` is absent when not known and
    ``inboundLinks`` on a truncated crawl; a present 0 is a real 0.
    """

    url: str
    status: int
    indexability: str
    openFindings: int
    finalUrl: NotRequired[str]
    depth: NotRequired[int]
    inboundLinks: NotRequired[int]


class SiteAuditPageList(TypedDict):
    """One page of the latest audit's URLs; ``auditedAt`` is absent before the first audit."""

    domainUuid: str
    truncated: bool
    offset: int
    limit: int
    total: int
    pages: list[SiteAuditPage]
    auditedAt: NotRequired[str]


class SiteAuditDelta(TypedDict):
    """What the latest audit opened, reopened and fixed; ``failure`` says why a failed run failed."""

    domainUuid: str
    run: str
    new: list[SiteFinding]
    reopened: list[SiteFinding]
    fixed: list[SiteFinding]
    auditedAt: NotRequired[str]
    failure: NotRequired[str]


class SiteReportUptime(TypedDict):
    status: SiteUptimeStatus
    windows: SiteUptimeWindows
    days: list[SiteUptimeDay]
    responseMs: NotRequired[int]
    downSince: NotRequired[str]
    monitoredSince: NotRequired[str]


class SiteReportCertificate(TypedDict):
    """``problem`` is true when the last certificate check failed."""

    problem: bool
    validTo: NotRequired[str]
    issuer: NotRequired[str]


class SiteReportSpeed(TypedDict):
    """The latest successful Lighthouse run of one profile in the last 30 days."""

    profile: SiteLighthouseProfile
    observedAt: str
    scores: SiteLighthouseScores
    metrics: SiteLighthouseMetrics


class SiteReportSearch(TypedDict):
    days: int
    connected: bool
    sources: list[SiteSearchSource]
    topQueries: list[SiteSearchRow]
    topPages: list[SiteSearchRow]
    strikingDistance: list[SiteSearchRow]


class SiteReportFinding(TypedDict):
    severity: str
    title: str
    url: str
    fix: str
    firstSeenAt: str


class SiteReportAudit(TypedDict):
    findings: list[SiteReportFinding]
    auditedAt: NotRequired[str]
    summary: NotRequired[SiteAuditSummary]


class SiteReport(TypedDict):
    """One domain's client report, without verification tokens or connection details.

    ``template`` is absent on servers before the template field; the server's default template is full.
    ``nextActions`` (the first three of get_next_actions) is absent from reports built or saved before
    servers sent them.
    """

    host: str
    generatedAt: str
    template: NotRequired[str]
    uptime: SiteReportUptime
    certificate: SiteReportCertificate
    speed: list[SiteReportSpeed]
    search: SiteReportSearch
    audit: SiteReportAudit
    nextActions: NotRequired[list[SiteNextAction]]


class SiteReportShare(TypedDict):
    """A public report link; ``reportUuid`` names the saved report it opens, absent for the live report."""

    shareUuid: str
    createdAt: str
    expiresAt: str
    reportUuid: NotRequired[str]


class SiteReportShareList(TypedDict):
    """Live report shares; their tokens are returned only on creation."""

    shares: list[SiteReportShare]


class SiteReportShareCreated(TypedDict):
    """A new share; open the report at ``/shared-report#<token>``. The token is shown once."""

    share: SiteReportShare
    token: str


class SavedSiteReportRequest(TypedDict):
    """Saves a report: a name unique on the domain, a template (default full) and 1..90 days (default 28)."""

    name: str
    template: NotRequired[SiteReportTemplate]
    days: NotRequired[int]


class SavedSiteReportSummary(TypedDict):
    """A saved report without its content; ``liveShares`` counts unexpired links that open it."""

    reportUuid: str
    name: str
    template: str
    days: int
    generatedAt: str
    createdAt: str
    liveShares: int


class SavedSiteReport(SavedSiteReportSummary):
    """A saved report and the content stored when it was built."""

    report: SiteReport


class SavedSiteReportList(TypedDict):
    """A domain's saved reports and how many it may keep."""

    reports: list[SavedSiteReportSummary]
    maxReports: int



class SiteIndexNowSubmission(TypedDict):
    """One batch of URLs sent to IndexNow.

    ``providerStatus`` is IndexNow's HTTP status (202 means received while the key is validated)
    and ``submittedAt`` when it was sent; both are absent while queued.
    """

    submissionUuid: str
    status: SiteIndexNowStatus
    urls: list[str]
    requestedAt: str
    providerStatus: NotRequired[int]
    failure: NotRequired[str]
    submittedAt: NotRequired[str]


class SiteIndexNowState(TypedDict):
    """A domain's IndexNow key, its verification and recent submissions.

    Serve a text file at ``keyLocation`` that holds only ``key``; both are absent while disabled.
    ``urlsToday`` counts the tenant's URLs in the last 24 hours against ``dailyUrlLimit``.
    """

    enabled: bool
    verified: bool
    dailyUrlLimit: int
    urlsToday: int
    submissions: list[SiteIndexNowSubmission]
    key: NotRequired[str]
    keyLocation: NotRequired[str]
    verifiedAt: NotRequired[str]
    lastCheckFailure: NotRequired[str]
