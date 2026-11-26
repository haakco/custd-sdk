<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRule is a stable rule ID a SiteFinding carries in `rule`, from Custd's siteaudit rule catalogue.
 * Key a client-side fix or display on these, never on the title. New rules can appear in findings
 * before an SDK release names them, so a finding's rule is a plain string compared against these constants.
 */
final class SiteRule
{
    public const CRAWL_PAGE_STATUS = 'crawl.page-status';
    public const CRAWL_REDIRECT_CHAIN = 'crawl.redirect-chain';
    public const CRAWL_SOFT_404 = 'crawl.soft-404';
    public const HOST_HTTPS_REDIRECT = 'host.https-redirect';
    public const HOST_CANONICAL_HOST = 'host.canonical-host';
    public const ROBOTS_MISSING = 'robots.missing';
    public const ROBOTS_INVALID = 'robots.invalid';
    public const ROBOTS_NO_SITEMAP = 'robots.no-sitemap';
    public const SITEMAP_MISSING = 'sitemap.missing';
    public const SITEMAP_INVALID = 'sitemap.invalid';
    public const SITEMAP_URL_NOT_OK = 'sitemap.url-not-ok';
    public const SITEMAP_NOINDEX_URL = 'sitemap.noindex-url';
    public const SITEMAP_LASTMOD_MISSING = 'sitemap.lastmod-missing';
    public const SITEMAP_BLOCKED_URL = 'sitemap.blocked-url';
    public const CANONICAL_MISSING = 'canonical.missing';
    public const CANONICAL_INVALID = 'canonical.invalid';
    public const CANONICAL_NOT_OK = 'canonical.not-ok';
    public const TITLE_MISSING = 'title.missing';
    public const TITLE_LENGTH = 'title.length';
    public const TITLE_DUPLICATE = 'title.duplicate';
    public const DESCRIPTION_MISSING = 'description.missing';
    public const DESCRIPTION_LENGTH = 'description.length';
    public const DESCRIPTION_DUPLICATE = 'description.duplicate';
    public const HEADING_H1 = 'heading.h1';
    public const HTML_LANG_MISSING = 'html.lang-missing';
    public const HTML_TOO_LARGE = 'html.too-large';
    public const OG_MISSING = 'og.missing';
    public const IMAGE_ALT_MISSING = 'image.alt-missing';
    public const IMAGE_TOO_LARGE = 'image.too-large';
    public const IMAGE_LEGACY_FORMAT = 'image.legacy-format';
    public const IMAGE_MISSING_DIMENSIONS = 'image.missing-dimensions';
    public const IMAGE_NOT_LAZY = 'image.not-lazy';
    public const HTTP_NO_COMPRESSION = 'http.no-compression';
    public const CACHE_STATIC_ASSETS = 'cache.static-assets';
    public const AI_JS_REQUIRED = 'ai.js-required';
    public const AI_ANSWER_BOT_BLOCKED = 'ai.answer-bot-blocked';
    public const AI_TRAINING_BOT_BLOCKED = 'ai.training-bot-blocked';
    public const AI_BOT_REFUSED = 'ai.bot-refused';
    public const JSONLD_MISSING = 'jsonld.missing';
    public const JSONLD_INVALID = 'jsonld.invalid';
    public const JSONLD_NO_ENTITY = 'jsonld.no-entity';
    public const LLMS_MISSING = 'llms.missing';
    public const LLMS_INVALID = 'llms.invalid';
    public const CRAWL_REDIRECT_LOOP = 'crawl.redirect-loop';
    public const CRAWL_ORPHAN_PAGE = 'crawl.orphan-page';
    public const CRAWL_BROKEN_FRAGMENT = 'crawl.broken-fragment';
    public const CRAWL_DEEP_PAGE = 'crawl.deep-page';
    public const CRAWL_NO_INTERNAL_LINKS = 'crawl.no-internal-links';
    public const CRAWL_NOINDEX_PAGE = 'crawl.noindex-page';
    public const CRAWL_HOME_NOINDEX = 'crawl.home-noindex';
    public const CANONICAL_POINTS_ELSEWHERE = 'canonical.points-elsewhere';
    public const CANONICAL_CONFLICT = 'canonical.conflict';
    public const HEADING_ORDER_SKIP = 'heading.order-skip';
    public const CONTENT_THIN = 'content.thin';
    public const CONTENT_DUPLICATE = 'content.duplicate';
    public const CONTENT_NEAR_DUPLICATE = 'content.near-duplicate';
    public const HTTP_SLOW_RESPONSE = 'http.slow-response';
    public const ROBOTS_NOFOLLOW = 'robots.nofollow';
    public const OG_IMAGE_MISSING = 'og.image-missing';
    public const OG_IMAGE_UNREACHABLE = 'og.image-unreachable';
    public const TWITTER_CARD_MISSING = 'twitter.card-missing';
    public const HREFLANG_INVALID_CODE = 'hreflang.invalid-code';
    public const HREFLANG_MISSING_SELF_REFERENCE = 'hreflang.missing-self-reference';
    public const HREFLANG_MISSING_RETURN_LINK = 'hreflang.missing-return-link';
    public const HREFLANG_MISSING_X_DEFAULT = 'hreflang.missing-x-default';
    public const HREFLANG_TARGET_NOT_INDEXABLE = 'hreflang.target-not-indexable';
    public const UPTIME_DOWN = 'uptime.down';
    public const UPTIME_SLOW = 'uptime.slow';
    public const TLS_INVALID = 'tls.invalid';
    public const TLS_EXPIRING = 'tls.expiring';
    public const TLS_EXPIRING_SOON = 'tls.expiring-soon';
    public const REGISTRATION_EXPIRING = 'registration.expiring';
    public const LOGS_CRAWLER_NOT_FOUND = 'logs.crawler-not-found';
    public const LIGHTHOUSE_DESKTOP_SCORE_DROP = 'lighthouse.desktop-score-drop';
    public const LIGHTHOUSE_MOBILE_SCORE_DROP = 'lighthouse.mobile-score-drop';
    public const SEARCH_LOW_CTR = 'search.low-ctr';
    public const SEARCH_POSITION_DROP = 'search.position-drop';
}
