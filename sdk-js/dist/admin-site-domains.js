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
};
const siteDomainsPath = "/site-domains";
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
    send(method, path, query, body, options) {
        const { companySlug, ...requestOptions } = options ?? {};
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries({ ...query, companySlug })) {
            if (value)
                params.set(key, value);
        }
        const search = params.toString();
        return this.request(method, search ? `${path}?${search}` : path, body, requestOptions);
    }
}
function domainPath(domainUuid) {
    return `${siteDomainsPath}/${encodeURIComponent(domainUuid)}`;
}
function searchConnectionPath(domainUuid, provider) {
    return `${domainPath(domainUuid)}/search/${encodeURIComponent(provider)}`;
}
