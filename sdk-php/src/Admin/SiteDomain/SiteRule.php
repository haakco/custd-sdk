<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRule is a stable rule ID a SiteFinding carries in `rule`, from Custd's siteaudit rule catalogue.
 * Key a client-side fix or display on these, never on the title. New rules can appear in findings
 * before an SDK release names them, so read a finding's rule with SiteRule::tryFrom().
 */
enum SiteRule: string
{
    case PageStatus = 'crawl.page-status';
    case RedirectChain = 'crawl.redirect-chain';
    case Soft404 = 'crawl.soft-404';
    case HTTPSRedirect = 'host.https-redirect';
    case CanonicalHost = 'host.canonical-host';
    case RobotsMissing = 'robots.missing';
    case RobotsInvalid = 'robots.invalid';
    case RobotsNoSitemap = 'robots.no-sitemap';
    case SitemapMissing = 'sitemap.missing';
    case SitemapInvalid = 'sitemap.invalid';
    case SitemapURLStatus = 'sitemap.url-not-ok';
    case SitemapNoindex = 'sitemap.noindex-url';
    case SitemapLastmod = 'sitemap.lastmod-missing';
    case CanonicalMissing = 'canonical.missing';
    case CanonicalInvalid = 'canonical.invalid';
    case CanonicalNotOK = 'canonical.not-ok';
    case TitleMissing = 'title.missing';
    case TitleLength = 'title.length';
    case TitleDuplicate = 'title.duplicate';
    case DescMissing = 'description.missing';
    case DescLength = 'description.length';
    case DescDuplicate = 'description.duplicate';
    case HeadingH1 = 'heading.h1';
    case LangMissing = 'html.lang-missing';
    case HTMLTooLarge = 'html.too-large';
    case OpenGraphMissing = 'og.missing';
    case OpenGraphImageMissing = 'og.image-missing';
    case OpenGraphImageUnreachable = 'og.image-unreachable';
    case TwitterCardMissing = 'twitter.card-missing';
    case ImageAltMissing = 'image.alt-missing';
    case ImageTooLarge = 'image.too-large';
    case ImageLegacyFormat = 'image.legacy-format';
    case ImageDimensions = 'image.missing-dimensions';
    case ImageNotLazy = 'image.not-lazy';
    case NoCompression = 'http.no-compression';
    case StaticCache = 'cache.static-assets';
    case JSRequired = 'ai.js-required';
    case AnswerBotBlocked = 'ai.answer-bot-blocked';
    case TrainingBlocked = 'ai.training-bot-blocked';
    case BotRefused = 'ai.bot-refused';
    case JSONLDMissing = 'jsonld.missing';
    case JSONLDInvalid = 'jsonld.invalid';
    case JSONLDNoEntity = 'jsonld.no-entity';
    case LLMSMissing = 'llms.missing';
    case LLMSInvalid = 'llms.invalid';
    case RedirectLoop = 'crawl.redirect-loop';
    case OrphanPage = 'crawl.orphan-page';
    case DeepPage = 'crawl.deep-page';
    case NoInternalLinks = 'crawl.no-internal-links';
    case NoindexPage = 'crawl.noindex-page';
    case HomeNoindex = 'crawl.home-noindex';
    case NofollowPage = 'robots.nofollow';
    case CanonicalElsewhere = 'canonical.points-elsewhere';
    case CanonicalConflict = 'canonical.conflict';
    case HeadingSkip = 'heading.order-skip';
    case ThinContent = 'content.thin';
    case DuplicateContent = 'content.duplicate';
    case NearDuplicate = 'content.near-duplicate';
    case HreflangInvalidCode = 'hreflang.invalid-code';
    case HreflangMissingSelf = 'hreflang.missing-self-reference';
    case HreflangMissingReturn = 'hreflang.missing-return-link';
    case HreflangMissingXDefault = 'hreflang.missing-x-default';
    case HreflangTargetNotIndexable = 'hreflang.target-not-indexable';
    case SlowResponse = 'http.slow-response';
    case UptimeDown = 'uptime.down';
    case UptimeSlow = 'uptime.slow';
    case TLSInvalid = 'tls.invalid';
    case TLSExpiring = 'tls.expiring';
    case TLSExpiringSoon = 'tls.expiring-soon';
    case LighthouseDesktopDrop = 'lighthouse.desktop-score-drop';
    case LighthouseMobileDrop = 'lighthouse.mobile-score-drop';
    case SearchLowCTR = 'search.low-ctr';
    case SearchPositionDrop = 'search.position-drop';
    case BrokenFragment = 'crawl.broken-fragment';
    case SitemapBlockedURL = 'sitemap.blocked-url';
    case LogsCrawlerNotFound = 'logs.crawler-not-found';
}
