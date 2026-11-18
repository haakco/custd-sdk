<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteLinkSourceTotal;
use HaakCo\Custd\Admin\SiteDomain\SiteWebDomain;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-links.json through the referring domains read. */
final class SiteReferringDomainsClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/referring-domains';

    private static function fixtureFile(): string
    {
        return 'site-links.json';
    }

    public function testReferringDomainsKeepAbsentCountsApartFromZeroAndFalse(): void
    {
        $links = $this->replay($calls, 'referringDomains')->webData()->getReferringDomains('example.com', 's-1');
        $pending = $this->replay($calls, 'referringDomainsPending')->webData()
            ->getReferringDomains('rival.example', companySlug: 'acme');
        $outside = $this->replay($calls, 'referringDomainsOutsideGraph')->webData()
            ->getReferringDomains('shop.example.dev');

        [$bing, $commonCrawl, $crawl] = $links->sources;
        [$news, $blog] = $links->referringDomains;
        self::assertSame(SiteWebDomain::ROLE_OWN, $links->role);
        self::assertSame(SiteLinkSourceTotal::SOURCE_BING, $bing->source);
        self::assertSame(57, $bing->links);
        self::assertSame(1843, $commonCrawl->referringDomains);
        self::assertNull($commonCrawl->links);
        self::assertFalse($commonCrawl->complete);
        self::assertSame(4, $crawl->links);
        self::assertSame(48210, $links->authority?->harmonicRank);
        self::assertSame(0.0000123, $links->authority->pageRank);
        self::assertFalse($news->followed);
        self::assertSame(4, $news->crawlLinks);
        self::assertNull($blog->crawlLinks);
        self::assertNull($blog->followed);
        self::assertSame(SiteLinkSourceTotal::STATUS_AVAILABLE, $links->lost->status);
        self::assertSame('cc-main-2026-may-jun-jul', $links->lost->previousRelease);
        self::assertNull($links->lost->domains[1]->harmonicRank);

        self::assertSame(SiteWebDomain::ROLE_COMPETITOR, $pending->role);
        self::assertSame(SiteLinkSourceTotal::STATUS_PENDING, $pending->sources[1]->status);
        self::assertNull($pending->sources[0]->referringDomains);
        self::assertNull($pending->sources[0]->asOf);
        self::assertNull($pending->authority);
        self::assertSame([], $pending->referringDomains);
        self::assertSame(SiteLinkSourceTotal::STATUS_PENDING, $pending->lost->status);
        self::assertNull($pending->lost->release);

        [$failed, $notHeld, $crawled] = $outside->sources;
        self::assertSame(SiteLinkSourceTotal::STATUS_FAILED, $failed->status);
        self::assertSame('bing GetLinkCounts: 401 Unauthorized', $failed->lastFailure);
        self::assertNull($failed->links);
        self::assertSame('cc-main-2026-aug-sep-oct', $notHeld->asOf);
        self::assertSame(0, $crawled->referringDomains);
        self::assertSame(0, $crawled->links);
        self::assertFalse($outside->authority?->inGraph);
        self::assertNull($outside->authority->harmonicRank);
        self::assertNull($outside->authority->harmonicCentrality);
        self::assertNull($outside->authority->hosts);
        self::assertSame(SiteLinkSourceTotal::STATUS_UNAVAILABLE, $outside->lost->status);
        self::assertSame([
            'GET ' . self::BASE . '?domain=example.com&siteUuid=s-1',
            'GET ' . self::BASE . '?domain=rival.example&companySlug=acme',
            'GET ' . self::BASE . '?domain=shop.example.dev',
        ], array_column($calls, 'route'));
    }
}
