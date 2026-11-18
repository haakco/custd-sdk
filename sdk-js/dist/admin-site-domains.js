// SiteDomainAdminClient claims, verifies, audits and checks the domains a Site
// serves, and reads their findings, outages, alert address and search numbers.
// The routes live on the top-level /api/v1/site-domains surface, not under
// /api/v1/admin. A system administrator names the tenant with `companySlug`;
// a site-bound credential (site_domains.manage) reaches its own Site only.
/** A 409 on requestAudit: the tenant has not proven control of the domain yet. */
export const SITE_DOMAIN_NOT_VERIFIED_CODE = "site_domain_not_verified";
/** A 409 on connectSearch: this Custd deployment has no account or key for the provider. */
export const SITE_SEARCH_NOT_CONFIGURED_CODE = "site_search_not_configured";
/** A 404 on disconnectSearch: the domain is not connected to that provider. */
export const SITE_SEARCH_CONNECTION_NOT_FOUND_CODE = "site_search_connection_not_found";
/** A 409 on retrySearchImport: only a failing connection retries now; reconnect a revoked one. */
export const SITE_SEARCH_RETRY_NOT_FAILING_CODE = "site_search_retry_not_failing";
/**
 * The stable rule IDs a SiteFinding carries in `rule`, from Custd's siteaudit
 * rule catalogue. Key a client-side fix or display on these, never on the title.
 * New rules can appear in findings before an SDK release names them.
 */
export const SiteRule = {
    PageStatus: "crawl.page-status",
    RedirectChain: "crawl.redirect-chain",
    Soft404: "crawl.soft-404",
    HTTPSRedirect: "host.https-redirect",
    CanonicalHost: "host.canonical-host",
    RobotsMissing: "robots.missing",
    RobotsInvalid: "robots.invalid",
    RobotsNoSitemap: "robots.no-sitemap",
    SitemapMissing: "sitemap.missing",
    SitemapInvalid: "sitemap.invalid",
    SitemapURLStatus: "sitemap.url-not-ok",
    SitemapNoindex: "sitemap.noindex-url",
    SitemapLastmod: "sitemap.lastmod-missing",
    CanonicalMissing: "canonical.missing",
    CanonicalInvalid: "canonical.invalid",
    CanonicalNotOK: "canonical.not-ok",
    TitleMissing: "title.missing",
    TitleLength: "title.length",
    TitleDuplicate: "title.duplicate",
    DescMissing: "description.missing",
    DescLength: "description.length",
    DescDuplicate: "description.duplicate",
    HeadingH1: "heading.h1",
    LangMissing: "html.lang-missing",
    HTMLTooLarge: "html.too-large",
    OpenGraphMissing: "og.missing",
    OpenGraphImageMissing: "og.image-missing",
    OpenGraphImageUnreachable: "og.image-unreachable",
    TwitterCardMissing: "twitter.card-missing",
    ImageAltMissing: "image.alt-missing",
    ImageTooLarge: "image.too-large",
    ImageLegacyFormat: "image.legacy-format",
    ImageDimensions: "image.missing-dimensions",
    ImageNotLazy: "image.not-lazy",
    NoCompression: "http.no-compression",
    StaticCache: "cache.static-assets",
    JSRequired: "ai.js-required",
    AnswerBotBlocked: "ai.answer-bot-blocked",
    TrainingBlocked: "ai.training-bot-blocked",
    BotRefused: "ai.bot-refused",
    JSONLDMissing: "jsonld.missing",
    JSONLDInvalid: "jsonld.invalid",
    JSONLDNoEntity: "jsonld.no-entity",
    LLMSMissing: "llms.missing",
    LLMSInvalid: "llms.invalid",
    RedirectLoop: "crawl.redirect-loop",
    OrphanPage: "crawl.orphan-page",
    DeepPage: "crawl.deep-page",
    NoInternalLinks: "crawl.no-internal-links",
    NoindexPage: "crawl.noindex-page",
    HomeNoindex: "crawl.home-noindex",
    NofollowPage: "robots.nofollow",
    CanonicalElsewhere: "canonical.points-elsewhere",
    CanonicalConflict: "canonical.conflict",
    HeadingSkip: "heading.order-skip",
    ThinContent: "content.thin",
    DuplicateContent: "content.duplicate",
    NearDuplicate: "content.near-duplicate",
    HreflangInvalidCode: "hreflang.invalid-code",
    HreflangMissingSelf: "hreflang.missing-self-reference",
    HreflangMissingReturn: "hreflang.missing-return-link",
    HreflangMissingXDefault: "hreflang.missing-x-default",
    HreflangTargetNotIndexable: "hreflang.target-not-indexable",
    SlowResponse: "http.slow-response",
    UptimeDown: "uptime.down",
    UptimeSlow: "uptime.slow",
    TLSInvalid: "tls.invalid",
    TLSExpiring: "tls.expiring",
    TLSExpiringSoon: "tls.expiring-soon",
    LighthouseDesktopDrop: "lighthouse.desktop-score-drop",
    LighthouseMobileDrop: "lighthouse.mobile-score-drop",
    SearchLowCTR: "search.low-ctr",
    SearchPositionDrop: "search.position-drop",
    BrokenFragment: "crawl.broken-fragment",
    SitemapBlockedURL: "sitemap.blocked-url",
    LogsCrawlerNotFound: "logs.crawler-not-found",
};
const siteDomainsPath = "/site-domains";
const siteAISettingsPath = `${siteDomainsPath}/ai-settings`;
const searchPoolPath = `${siteDomainsPath}/search-pool`;
const keywordListsPath = `${siteDomainsPath}/keyword-lists`;
export class SiteDomainAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** Claims a host for a Site and returns the verification instructions. */
    create(body, options) {
        return this.send("POST", siteDomainsPath, {}, body, options);
    }
    /** Lists one Site's domains. A site-bound credential may omit siteUuid for its own Site. */
    list(siteUuid, options) {
        return this.send("GET", siteDomainsPath, { siteUuid }, undefined, options);
    }
    get(domainUuid, options) {
        return this.send("GET", domainPath(domainUuid), {}, undefined, options);
    }
    /**
     * Checks the DNS record or well-known file now. An unproven domain comes back
     * with ownership.verified false and the reason in ownership.lastCheckFailure.
     */
    verify(domainUuid, options) {
        return this.send("POST", `${domainPath(domainUuid)}/verify`, {}, undefined, options);
    }
    /**
     * Attests that this credential has proven the tenant controls the domain,
     * which verifies it (verifiedBy "attested") and its subdomains. Only a
     * site-bound credential holding site_domains.attest may attest its own Site's domains.
     */
    attest(domainUuid, options) {
        return this.send("POST", `${domainPath(domainUuid)}/attestation`, {}, undefined, options);
    }
    /** Withdraws this credential's attestation; the domain stays verified only by its own proof or a verified parent. */
    unattest(domainUuid, options) {
        return this.send("DELETE", `${domainPath(domainUuid)}/attestation`, {}, undefined, options);
    }
    /** Queues an audit for the scheduler's next tick. An unverified domain is refused with SITE_DOMAIN_NOT_VERIFIED_CODE. */
    requestAudit(domainUuid, options) {
        return this.send("POST", `${domainPath(domainUuid)}/audit`, {}, undefined, options);
    }
    /** Lists a domain's findings, most severe first. An omitted state lets the server default to open. */
    listFindings(domainUuid, state, options) {
        return this.send("GET", `${domainPath(domainUuid)}/findings`, { state }, undefined, options);
    }
    /** Removes a domain and its findings. */
    delete(domainUuid, options) {
        return this.send("DELETE", domainPath(domainUuid), {}, undefined, options);
    }
    /** Chooses how a domain is checked. It works before verification, so a domain can be paused before its first check. */
    setCheckMode(domainUuid, mode, options) {
        return this.send("PUT", `${domainPath(domainUuid)}/checks`, {}, { mode }, options);
    }
    /** Lists a domain's recent outages, newest first (at most twenty). */
    listIncidents(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/incidents`, {}, undefined, options);
    }
    /** Reads a Site's alert address. A site-bound credential may omit siteUuid. */
    getAlertDestination(siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/alert-destination`, { siteUuid }, undefined, options);
    }
    /** Emails a Site's alerts to emailRecipient, or back to the tenant's destinations when it is empty. */
    setAlertDestination(body, options) {
        return this.send("PUT", `${siteDomainsPath}/alert-destination`, { siteUuid: body.siteUuid }, { emailRecipient: body.emailRecipient }, options);
    }
    /** Reads which search providers this Custd deployment can import from. */
    getSearchAccount(options) {
        return this.send("GET", `${siteDomainsPath}/search-account`, {}, undefined, options);
    }
    /** Reads the tenant's AI policy and current provider terms version. */
    getAISettings(options) {
        return this.send("GET", siteAISettingsPath, {}, undefined, options);
    }
    /** Replaces the tenant's AI mode and cap. The API key is write-only. */
    setAISettings(body, options) {
        return this.send("PUT", siteAISettingsPath, {}, body, options);
    }
    /** Records explicit acceptance of the supplied terms version or revokes consent. */
    setAIConsent(body, options) {
        return this.send("PUT", `${siteAISettingsPath}/consent`, {}, body, options);
    }
    /** Reads the tenant's current UTC month's AI usage. */
    getAIUsage(options) {
        return this.send("GET", `${siteDomainsPath}/ai-usage`, {}, undefined, options);
    }
    /** Reads whether the tenant takes part in the shared search pool, and the pool's rules. */
    getSearchPool(options) {
        return this.send("GET", searchPoolPath, {}, undefined, options);
    }
    /** Joins (true) or leaves (false) the shared search pool for the whole tenant. */
    /**
     * Joins (with the terms version the caller accepted) or leaves the shared search pool.
     * Joining without a termsVersion is refused before any request; leaving sends only joined.
     */
    setSearchPool(joined, termsVersion, options) {
        if (!joined)
            return this.send("PUT", searchPoolPath, {}, { joined }, options);
        if (typeof termsVersion !== "string" || termsVersion.trim() === "") {
            return Promise.reject(new Error("custd: joining the shared search pool needs the accepted termsVersion"));
        }
        return this.send("PUT", searchPoolPath, {}, { joined, termsVersion }, options);
    }
    /**
     * Reads pooled queries matching `search` (at most 100 characters), `limit` 1..200; omitted, 50.
     * Before joining it is refused with SITE_SEARCH_POOL_NOT_JOINED_CODE.
     */
    listSearchPoolQueries(search, limit, options) {
        const query = { limit: limit?.toString(), search };
        return this.send("GET", `${searchPoolPath}/queries`, query, undefined, options);
    }
    /** Reads a domain's search numbers over the last `days` days (1..90); omitted, the server uses 28. */
    getSearchPerformance(domainUuid, days, options) {
        return this.send("GET", `${domainPath(domainUuid)}/search`, { days: days?.toString() }, undefined, options);
    }
    /** Connects a domain to a provider, or replaces its property or key. Refused with SITE_SEARCH_NOT_CONFIGURED_CODE when the deployment lacks the provider. */
    connectSearch(domainUuid, provider, body, options) {
        return this.send("PUT", searchConnectionPath(domainUuid, provider), {}, body, options);
    }
    /** Removes a provider connection and the numbers imported through it. */
    disconnectSearch(domainUuid, provider, options) {
        return this.send("DELETE", searchConnectionPath(domainUuid, provider), {}, undefined, options);
    }
    /** Reads what the latest audit or recheck read from one page of the domain. */
    /** Retries a failing search import now; anything else is refused with SITE_SEARCH_RETRY_NOT_FAILING_CODE. */
    retrySearchImport(domainUuid, provider, options) {
        return this.send("POST", `${searchConnectionPath(domainUuid, provider)}/retry`, {}, undefined, options);
    }
    /** Reads the searches one page shows for, with title options and pages that could link to it. */
    getPageSearchQueries(domainUuid, url, options) {
        return this.send("GET", `${domainPath(domainUuid)}/page-search-queries`, { url }, undefined, options);
    }
    /** Reads the domain's GA4 landing pages, key events and channels; empty until connected and imported. */
    getAnalytics(domainUuid, options) {
        return this.send("GET", analyticsPath(domainUuid), {}, undefined, options);
    }
    /** Connects the domain to a GA4 property; a bad ID is refused with SITE_ANALYTICS_PROPERTY_INVALID_CODE. */
    connectAnalytics(domainUuid, body, options) {
        const request = { propertyId: body.propertyId };
        return this.send("PUT", `${analyticsPath(domainUuid)}/ga4`, {}, request, options);
    }
    /** Disconnects GA4; an unconnected domain is refused with SITE_ANALYTICS_CONNECTION_NOT_FOUND_CODE. */
    disconnectAnalytics(domainUuid, options) {
        return this.send("DELETE", `${analyticsPath(domainUuid)}/ga4`, {}, undefined, options);
    }
    /** Exports everything Site Insights holds for the domain and its Site, except the daily search metrics. */
    getExport(domainUuid, options) {
        return this.send("GET", exportPath(domainUuid), {}, undefined, options);
    }
    /** Pages through the domain's daily search metrics; the export's search.metricRows is the total. */
    listExportSearchMetrics(domainUuid, query = {}, options) {
        const values = { offset: query.offset?.toString(), limit: query.limit?.toString() };
        return this.send("GET", `${exportPath(domainUuid)}/search-metrics`, values, undefined, options);
    }
    /** Reads what the last audit or recheck saw on a page; an unread page is refused with SITE_PAGE_NOT_READ_CODE. */
    getPageFacts(domainUuid, url, options) {
        return this.send("GET", `${domainPath(domainUuid)}/page-facts`, { url }, undefined, options);
    }
    /**
     * Queues one page of a verified domain for recheck (202). A page already queued comes back as it is;
     * past the hourly allowance the server refuses with SITE_PAGE_RECHECK_LIMIT_CODE, and a page of
     * another host with SITE_PAGE_NOT_ON_DOMAIN_CODE.
     */
    requestPageRecheck(domainUuid, url, options) {
        return this.send("POST", `${domainPath(domainUuid)}/page-rechecks`, {}, { url }, options);
    }
    getPageRecheck(domainUuid, recheckUuid, options) {
        const path = `${domainPath(domainUuid)}/page-rechecks/${encodeURIComponent(recheckUuid)}`;
        return this.send("GET", path, {}, undefined, options);
    }
    /** Reads up to SITE_PAGE_RECHECK_READ_LIMIT of the domain's rechecks at once; unknown ids are left out. */
    listPageRechecks(domainUuid, recheckUuids, options) {
        return this.send("GET", `${domainPath(domainUuid)}/page-rechecks`, { ids: recheckUuids.join(",") }, undefined, options);
    }
    /** Runs the one-page checks on draft HTML, and the draft tools it asks for; nothing is fetched or stored. */
    async checkPage(domainUuid, body, options) {
        const request = { url: body.url, html: body.html };
        if (body.previousUrl)
            request.previousUrl = body.previousUrl;
        if (body.phrase)
            request.phrase = body.phrase;
        if (body.scope)
            request.scope = body.scope;
        const check = await this.send("POST", `${domainPath(domainUuid)}/page-check`, {}, request, options);
        if (check.phrase?.wordCount === 0)
            delete check.phrase.densityPercent;
        return check;
    }
    /** Measures how much wording two drafts share, as the near-duplicate rule does; nothing is stored. */
    async compareWording(domainUuid, body, options) {
        const request = { first: body.first, second: body.second };
        const path = `${domainPath(domainUuid)}/wording-compare`;
        const result = await this.send("POST", path, {}, request, options);
        if (!result.compared)
            delete result.sharedPercent;
        return result;
    }
    /** Tests a URL against a pasted robots.txt, or the domain's live file when robotsTxt is omitted. */
    testRobots(domainUuid, body, options) {
        const request = { url: body.url, userAgent: body.userAgent };
        if (body.robotsTxt !== undefined)
            request.robotsTxt = body.robotsTxt;
        return this.send("POST", `${domainPath(domainUuid)}/robots-test`, {}, request, options);
    }
    /** Pages through one dimension of the domain's imported search rows; `unavailable` names providers without it. */
    listSearchRows(domainUuid, query = {}, options) {
        const values = {
            dimension: query.dimension,
            provider: query.provider,
            days: query.days?.toString(),
            offset: query.offset?.toString(),
            limit: query.limit?.toString(),
        };
        return this.send("GET", `${domainPath(domainUuid)}/search/rows`, values, undefined, options);
    }
    /** Lists the domain's latest URL inspections and the tenant's daily use. */
    listSearchInspections(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/search/inspections`, {}, undefined, options);
    }
    /**
     * Queues a Search Console URL Inspection (202). Refusals carry SITE_SEARCH_INSPECTION_URL_INVALID_CODE,
     * SITE_SEARCH_INSPECTION_NOT_CONNECTED_CODE or SITE_SEARCH_INSPECTION_LIMIT_CODE.
     */
    requestSearchInspection(domainUuid, url, options) {
        return this.send("POST", `${domainPath(domainUuid)}/search/inspections`, {}, { url }, options);
    }
    /** Reads a Site's brands, competitors and markets. A site-bound credential may omit siteUuid. */
    getProjectContext(siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/project-context`, { siteUuid }, undefined, options);
    }
    /** Replaces a Site's project context; an omitted list is sent empty and clears it. */
    setProjectContext(body, options) {
        const request = {
            brandNames: body.brandNames ?? [],
            competitorDomains: body.competitorDomains ?? [],
            markets: body.markets ?? [],
        };
        return this.send("PUT", `${siteDomainsPath}/project-context`, { siteUuid: body.siteUuid }, request, options);
    }
    /** Reads the domain's status and its most important next actions, most important first. */
    getNextActions(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/next-actions`, {}, undefined, options);
    }
    /** Reads every domain's status, open findings and first action, worst first (only its own Site's for a site-bound credential). */
    getPortfolioSummary(options) {
        return this.send("GET", `${siteDomainsPath}/portfolio-summary`, {}, undefined, options);
    }
    /** Reads the client report without private verification or connection details, in options.template over options.days. */
    getReport(domainUuid, options) {
        const { template, days, ...requestOptions } = options ?? {};
        const query = { template, days: days?.toString() };
        return this.send("GET", `${domainPath(domainUuid)}/report`, query, undefined, requestOptions);
    }
    /** Reads uptime windows, ninety daily bars and hourly response times over `responseDays` (1..90). */
    getUptimeHistory(domainUuid, responseDays, options) {
        const query = { responseDays: responseDays?.toString() };
        return this.send("GET", `${domainPath(domainUuid)}/uptime-history`, query, undefined, options);
    }
    /**
     * Reads scheduled desktop and mobile lab runs over `days` (1..30); omitted, the server uses seven.
     * options.url reads one extra page's runs instead of the home page's.
     */
    getLighthouseHistory(domainUuid, days, options) {
        const { url, ...requestOptions } = options ?? {};
        const query = { days: days?.toString(), url };
        return this.send("GET", `${domainPath(domainUuid)}/lighthouse`, query, undefined, requestOptions);
    }
    /** Reads the extra pages Lighthouse measures beside the home page. */
    getLighthousePages(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/lighthouse/pages`, {}, undefined, options);
    }
    /** Replaces the extra pages (at most five); an empty list clears them. Refused with SITE_LIGHTHOUSE_PAGE_NOT_EXTRA_CODE. */
    setLighthousePages(domainUuid, urls, options) {
        return this.send("PUT", `${domainPath(domainUuid)}/lighthouse/pages`, {}, { urls: [...urls] }, options);
    }
    /** Pages through the URLs the latest audit crawled; the server defaults limit to 50 (at most 200). */
    listAuditPages(domainUuid, offset, limit, options) {
        const query = { offset: offset?.toString(), limit: limit?.toString() };
        return this.send("GET", `${domainPath(domainUuid)}/audit-pages`, query, undefined, options);
    }
    /** Reads the findings the latest audit opened, reopened and fixed. */
    getAuditDelta(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/audit-delta`, {}, undefined, options);
    }
    /** Lists the domain's saved reports, newest content first. */
    listSavedReports(domainUuid, options) {
        return this.send("GET", savedReportsPath(domainUuid), {}, undefined, options);
    }
    /** Generates and saves a report. Refused with SAVED_SITE_REPORT_NAME_TAKEN_CODE or SAVED_SITE_REPORT_LIMIT_CODE. */
    saveReport(domainUuid, body, options) {
        return this.send("POST", savedReportsPath(domainUuid), {}, savedReportBody(body), options);
    }
    getSavedReport(domainUuid, reportUuid, options) {
        return this.send("GET", savedReportPath(domainUuid, reportUuid), {}, undefined, options);
    }
    /** Renames or regenerates a saved report; its shares open the new content. */
    replaceSavedReport(domainUuid, reportUuid, body, options) {
        return this.send("PUT", savedReportPath(domainUuid, reportUuid), {}, savedReportBody(body), options);
    }
    /** Deletes a saved report. */
    deleteSavedReport(domainUuid, reportUuid, options) {
        return this.send("DELETE", savedReportPath(domainUuid, reportUuid), {}, undefined, options);
    }
    /** Lists the domain's active campaign links, newest first, and archived ones too with includeArchived. */
    listCampaignLinks(domainUuid, includeArchived = false, options) {
        const query = { archived: includeArchived ? "true" : undefined };
        return this.send("GET", campaignLinksPath(domainUuid), query, undefined, options);
    }
    /**
     * Saves a tagged page link (201). Refused with SITE_CAMPAIGN_LINK_TAKEN_CODE or
     * SITE_CAMPAIGN_LINK_LIMIT_CODE, and a page of another host with SITE_PAGE_NOT_ON_DOMAIN_CODE.
     */
    createCampaignLink(domainUuid, body, options) {
        const request = {
            url: body.url,
            source: body.source,
            medium: body.medium,
            campaign: body.campaign,
        };
        if (body.term)
            request.term = body.term;
        if (body.content)
            request.content = body.content;
        return this.send("POST", campaignLinksPath(domainUuid), {}, request, options);
    }
    /** Archives a link: it stays listed with archived links and its tagged URL is free again. */
    archiveCampaignLink(domainUuid, linkUuid, options) {
        const path = `${campaignLinksPath(domainUuid)}/${encodeURIComponent(linkUuid)}/archive`;
        return this.send("POST", path, {}, undefined, options);
    }
    /** Lists live report shares. Tokens are returned only on creation. */
    listReportShares(domainUuid, options) {
        return this.send("GET", `${domainPath(domainUuid)}/report-shares`, {}, undefined, options);
    }
    /** Creates a public report share. Copy the token once; creation is never retried automatically. */
    createReportShare(domainUuid, body = {}, options) {
        const request = { expiresInDays: body.expiresInDays ?? 30 };
        if (body.reportUuid)
            request.reportUuid = body.reportUuid;
        return this.send("POST", `${domainPath(domainUuid)}/report-shares`, {}, request, options);
    }
    /** Revokes a share; later public reads fail. */
    revokeReportShare(domainUuid, shareUuid, options) {
        const path = `${domainPath(domainUuid)}/report-shares/${encodeURIComponent(shareUuid)}`;
        return this.send("DELETE", path, {}, undefined, options);
    }
    /** Reads the domain's IndexNow setup, today's use and its recent submissions. */
    getIndexNow(domainUuid, options) {
        return this.send("GET", indexNowPath(domainUuid), {}, undefined, options);
    }
    /** Enables IndexNow and returns the key to host at keyLocation. An unverified domain is refused with SITE_INDEXNOW_DOMAIN_UNVERIFIED_CODE. */
    enableIndexNow(domainUuid, options) {
        return this.send("PUT", indexNowPath(domainUuid), {}, undefined, options);
    }
    /** Disables IndexNow for the domain. */
    disableIndexNow(domainUuid, options) {
        return this.send("DELETE", indexNowPath(domainUuid), {}, undefined, options);
    }
    /** Checks the hosted key file now. A failed check is not an error: it comes back in lastCheckFailure. */
    verifyIndexNowKey(domainUuid, options) {
        return this.send("POST", `${indexNowPath(domainUuid)}/verify`, {}, undefined, options);
    }
    /**
     * Queues URLs for IndexNow (202). Refusals carry SITE_INDEXNOW_NOT_ENABLED_CODE,
     * SITE_INDEXNOW_KEY_UNVERIFIED_CODE, SITE_INDEXNOW_URLS_INVALID_CODE or SITE_INDEXNOW_LIMIT_CODE.
     */
    submitIndexNow(domainUuid, body, options) {
        return this.send("POST", `${indexNowPath(domainUuid)}/submissions`, {}, { urls: body.urls }, options);
    }
    /** Reads the Site's own and competitor domains and their inventory state. */
    getWebDomains(siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/web-domains`, { siteUuid }, undefined, options);
    }
    /** Pages through one inventoried domain's URLs; pass the previous page's `next` as `after`. */
    listWebPages(domain, query = {}, options) {
        const values = { siteUuid: query.siteUuid, domain, after: query.after, limit: query.limit?.toString() };
        return this.send("GET", `${siteDomainsPath}/web-pages`, values, undefined, options);
    }
    /** Reads the domains linking to one of the Site's web domains, per source, with its authority and lost links. */
    getReferringDomains(domain, siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/referring-domains`, { domain, siteUuid }, undefined, options);
    }
    /** Reads monthly Wikipedia interest in the Site's brands and seed term. */
    getTopicTrends(siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/topic-trends`, { siteUuid }, undefined, options);
    }
    /** Reads the topics competitors cover and the Site does not, optionally around a seed term. */
    getContentGap(siteUuid, seed, options) {
        return this.send("GET", `${siteDomainsPath}/content-gap`, { siteUuid, seed }, undefined, options);
    }
    listKeywordLists(siteUuid, options) {
        return this.send("GET", keywordListsPath, { siteUuid }, undefined, options);
    }
    /** Creates or replaces the named list. A new list past the limit is refused with SITE_KEYWORD_LIST_LIMIT_CODE. */
    saveKeywordList(body, siteUuid, options) {
        const request = { name: body.name, keywords: [...body.keywords] };
        if (body.seedTerm)
            request.seedTerm = body.seedTerm;
        return this.send("PUT", keywordListsPath, { siteUuid }, request, options);
    }
    /** Deletes the named list. An unknown name is refused with SITE_KEYWORD_LIST_NOT_FOUND_CODE. */
    deleteKeywordList(name, siteUuid, options) {
        return this.send("DELETE", keywordListsPath, { siteUuid, name }, undefined, options);
    }
    /** Groups the named list's keywords by shared stem with the Site's own search numbers. */
    getKeywordClusters(name, siteUuid, options) {
        return this.send("GET", `${siteDomainsPath}/keyword-clusters`, { siteUuid, name }, undefined, options);
    }
    /** Compares search for a finding's page over `days` (7..90) before and after it was fixed; omitted, 28. */
    getFindingSearchImpact(domainUuid, findingUuid, days, options) {
        const path = `${domainPath(domainUuid)}/findings/${encodeURIComponent(findingUuid)}/search-impact`;
        return this.send("GET", path, { days: days?.toString() }, undefined, options);
    }
    /** Reads search landing pages with the goal events (1..5 event types) credited to them over `days` (1..90). */
    getSearchValue(domainUuid, goals, days, options) {
        const query = { goal: [...goals], days: days?.toString() };
        return this.send("GET", `${domainPath(domainUuid)}/search-value`, query, undefined, options);
    }
    /** Reads the domain's access-log traffic over UTC days `from`..`to` (YYYY-MM-DD); omitted, the server picks them. */
    getTraffic(domainUuid, from, to, options) {
        return this.send("GET", `${domainPath(domainUuid)}/traffic`, { from, to }, undefined, options);
    }
    /** Reads AI crawler requests and AI-assistant referrals over UTC days `from`..`to`. */
    getAIVisibility(domainUuid, from, to, options) {
        return this.send("GET", `${domainPath(domainUuid)}/ai-visibility`, { from, to }, undefined, options);
    }
    /**
     * Has the access-log task read one UTC hour again (202). System administrators only; the route is
     * platform-wide. A bad hour is refused with ACCESS_LOG_HOUR_INVALID_CODE.
     */
    replayAccessLogHour(hourStart, options) {
        const body = { hourStart: typeof hourStart === "string" ? hourStart : utcSeconds(hourStart) };
        return this.send("POST", "/admin/access-log-hours/replay", {}, body, options);
    }
    /** Reads tracked keywords and each day's rank over `days` (1..90); omitted, the server uses 28. */
    getRankings(domainUuid, days, options) {
        return this.send("GET", `${domainPath(domainUuid)}/rankings`, { days: days?.toString() }, undefined, options);
    }
    /**
     * Starts tracking a keyword (201). Refusals carry SITE_TRACKED_KEYWORD_INVALID_CODE,
     * SITE_TRACKED_KEYWORD_LIMIT_CODE or SITE_TRACKED_KEYWORD_DUPLICATE_CODE.
     */
    trackKeyword(domainUuid, body, options) {
        const request = { keyword: body.keyword };
        if (body.country)
            request.country = body.country;
        if (body.device)
            request.device = body.device;
        if (body.notifyPosition !== undefined)
            request.notifyPosition = body.notifyPosition;
        return this.send("POST", rankingKeywordsPath(domainUuid), {}, request, options);
    }
    /** Pauses or resumes a keyword and, when notifyPosition is set, changes its alert position. */
    updateTrackedKeyword(domainUuid, keywordUuid, body, options) {
        const request = { paused: body.paused };
        if (body.notifyPosition)
            request.notifyPosition = body.notifyPosition;
        return this.send("PUT", rankingKeywordPath(domainUuid, keywordUuid), {}, request, options);
    }
    /** Stops tracking a keyword and removes its observations. */
    untrackKeyword(domainUuid, keywordUuid, options) {
        return this.send("DELETE", rankingKeywordPath(domainUuid, keywordUuid), {}, undefined, options);
    }
    send(method, path, query, body, options) {
        const { companySlug, ...requestOptions } = options ?? {};
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries({ ...query, companySlug })) {
            if (Array.isArray(value)) {
                for (const item of value)
                    params.append(key, item);
            }
            else if (value) {
                params.set(key, value);
            }
        }
        const search = params.toString();
        return this.request(method, search ? `${path}?${search}` : path, body, requestOptions);
    }
}
function domainPath(domainUuid) {
    return `${siteDomainsPath}/${encodeURIComponent(domainUuid)}`;
}
function savedReportsPath(domainUuid) {
    return `${domainPath(domainUuid)}/saved-reports`;
}
function savedReportPath(domainUuid, reportUuid) {
    return `${savedReportsPath(domainUuid)}/${encodeURIComponent(reportUuid)}`;
}
function savedReportBody(body) {
    const request = { name: body.name };
    if (body.template)
        request.template = body.template;
    if (body.days !== undefined)
        request.days = body.days;
    return request;
}
function campaignLinksPath(domainUuid) {
    return `${domainPath(domainUuid)}/campaign-links`;
}
function rankingKeywordsPath(domainUuid) {
    return `${domainPath(domainUuid)}/rankings/keywords`;
}
function rankingKeywordPath(domainUuid, keywordUuid) {
    return `${rankingKeywordsPath(domainUuid)}/${encodeURIComponent(keywordUuid)}`;
}
/** RFC 3339 UTC to the second, as the server documents hour starts. */
function utcSeconds(value) {
    return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}
function analyticsPath(domainUuid) {
    return `${domainPath(domainUuid)}/analytics`;
}
function exportPath(domainUuid) {
    return `${domainPath(domainUuid)}/export`;
}
function indexNowPath(domainUuid) {
    return `${domainPath(domainUuid)}/indexnow`;
}
function searchConnectionPath(domainUuid, provider) {
    return `${domainPath(domainUuid)}/search/${encodeURIComponent(provider)}`;
}
