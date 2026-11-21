<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SitePageLinkSource;
use HaakCo\Custd\Admin\SiteDomain\SitePageSearchQueries;
use HaakCo\Custd\Admin\SiteDomain\SitePageTitleOption;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-page-queries.json through the page search queries read. */
final class SitePageSearchQueriesTest extends TestCase
{
    use SiteFixtureReplay;

    private static function fixtureFile(): string
    {
        return 'site-page-queries.json';
    }

    public function testPageQueriesDecodeAndANotConnectedPageHasNoWindow(): void
    {
        $page = $this->replay($calls, 'pageSearchQueries')
            ->getPageSearchQueries('d-1', 'https://shop.example.com/pricing', 'acme');
        $none = $this->replay($calls, 'pageSearchQueriesNotConnected')
            ->getPageSearchQueries('d-1', 'https://shop.example.com/pricing');

        self::assertSame(SitePageSearchQueries::STATE_AVAILABLE, $page->state);
        self::assertSame('2026-10-18', $page->window?->from);
        self::assertSame(4.2, $page->queries[0]->position);
        self::assertTrue($page->queries[0]->inDescription);
        self::assertSame(SitePageTitleOption::TEMPLATE_GUIDE, $page->titleOptions[1]->template);
        self::assertSame(SitePageLinkSource::WHERE_TITLE, $page->linkSources[0]->where);
        self::assertSame(SitePageSearchQueries::STATE_NOT_CONNECTED, $none->state);
        self::assertNull($none->window);
        self::assertSame([], $none->queries);
        self::assertSame([
            'GET http://localhost:8080/api/v1/site-domains/d-1/page-search-queries'
                . '?url=https%3A%2F%2Fshop.example.com%2Fpricing&companySlug=acme',
            'GET http://localhost:8080/api/v1/site-domains/d-1/page-search-queries'
                . '?url=https%3A%2F%2Fshop.example.com%2Fpricing',
        ], array_column($calls, 'route'));
    }
}
