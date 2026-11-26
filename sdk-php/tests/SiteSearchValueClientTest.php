<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchGoalStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingImpactStatus;

/** Replays contract-fixtures/site-search-value.json through the finding search impact and search value calls. */
final class SiteSearchValueClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1';

    private static function fixtureFile(): string
    {
        return 'site-search-value.json';
    }

    public function testFindingImpactKeepsInsufficientPeriodsApartFromZero(): void
    {
        $impact = $this->replay($calls, 'findingImpact')->getFindingSearchImpact('d-1', 'f-fixed', 28, 'acme');
        $open = $this->replay($calls, 'findingImpactOpen')->getFindingSearchImpact('d-1', 'f-open');

        [$google, $bing] = $impact->sources;
        self::assertSame(SiteFindingImpactStatus::MEASURED, $impact->status);
        self::assertSame('https://example.com/about', $impact->pageUrl);
        self::assertSame('2026-10-16', $impact->after?->from);
        self::assertSame(SiteSearchProvider::GOOGLE, $google->provider);
        self::assertSame(40, $google->before->clicks);
        self::assertSame(0, $google->after->clicks);
        self::assertSame(0.0, $google->after->ctr);
        self::assertSame(SiteFindingImpactStatus::INSUFFICIENT, $bing->after->status);
        self::assertNull($bing->after->clicks);
        self::assertNull($bing->after->impressions);
        self::assertNull($bing->after->ctr);
        self::assertNotNull($bing->after->reason);
        self::assertSame(SiteFindingImpactStatus::OPEN, $open->status);
        self::assertNull($open->fixedAt);
        self::assertNull($open->before);
        self::assertSame([], $open->sources);
        self::assertSame([
            'GET ' . self::BASE . '/findings/f-fixed/search-impact?days=28&companySlug=acme',
            'GET ' . self::BASE . '/findings/f-open/search-impact',
        ], array_column($calls, 'route'));
    }

    public function testSearchValueRepeatsGoalsAndKeepsUnreadGoalsNull(): void
    {
        $value = $this->replay($calls, 'searchValue')->getSearchValue('d-1', ['signup', 'purchase'], 28, 'acme');
        $unavailable = $this->replay($calls, 'searchValueUnavailable')->getSearchValue('d-1', ['signup']);

        [$pricing, $blog, $old] = $value->pages;
        self::assertSame(SiteSearchGoalStatus::PARTIAL, $value->goalStatus);
        self::assertSame(['signup', 'purchase'], $value->goals);
        self::assertSame(9, $pricing->goalConversions);
        self::assertSame(4.2, $pricing->search->position);
        self::assertSame(0, $blog->goalConversions);
        self::assertSame(SiteSearchProvider::BING, $old->provider);
        self::assertNull($old->landings);
        self::assertNull($old->goalConversions);
        self::assertNull($old->search->position);
        self::assertSame(SiteSearchGoalStatus::UNAVAILABLE, $unavailable->goalStatus);
        self::assertNull($unavailable->pages[0]->landings);
        self::assertSame([
            'GET ' . self::BASE . '/search-value?goal=signup&goal=purchase&days=28&companySlug=acme',
            'GET ' . self::BASE . '/search-value?goal=signup',
        ], array_column($calls, 'route'));
    }
}
