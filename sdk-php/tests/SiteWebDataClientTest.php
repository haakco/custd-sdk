<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteContentGap;
use HaakCo\Custd\Admin\SiteDomain\SiteKeywordListRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteTopicTrend;
use HaakCo\Custd\Admin\SiteDomain\SiteWebDomain;
use HaakCo\Custd\Admin\SiteDomain\SiteWebPage;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\Admin\SiteWebDataClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-web-data.json through the web data and keyword list calls. */
final class SiteWebDataClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains';
    private const SITE = '3c59dc04-8b0f-4a3e-8f2d-6b7c1e9a4d22';

    private static function fixtureFile(): string
    {
        return 'site-web-data.json';
    }

    public function testWebDomainsAndPagesKeepUnknownRanksAndPaging(): void
    {
        $domains = $this->replay($calls, 'webDomains')->webData()->getWebDomains();
        $pages = $this->replay($calls, 'webPages')->webData()->listWebPages('rival.example', self::SITE, limit: 2);
        $last = $this->replay($calls, 'webPagesLast')->webData()
            ->listWebPages('rival.example', after: 'https://rival.example/pricing', companySlug: 'acme');

        [$own, $rival, $new] = $domains->domains;
        self::assertSame(SiteWebDomain::ROLE_OWN, $own->role);
        self::assertSame(8421, $own->trancoRank);
        self::assertSame(SiteWebDomain::TRANCO_UNRANKED, $rival->trancoBand);
        self::assertNull($rival->trancoRank);
        self::assertSame('sitemap.xml answered HTTP 503', $rival->lastFailure);
        self::assertSame(SiteWebDomain::INVENTORY_PENDING, $new->sitemapStatus);
        self::assertNull($new->inventoryAt);
        self::assertNull($new->trancoListDay);
        self::assertSame(0, $new->pageCount);
        self::assertSame([SiteWebPage::SOURCE_SITEMAP, SiteWebPage::SOURCE_WAYBACK], $pages->pages[0]->sources);
        self::assertSame('https://rival.example/pricing', $pages->next);
        self::assertNull($last->next);
        self::assertSame([
            'GET ' . self::BASE . '/web-domains',
            'GET ' . self::BASE . '/web-pages?siteUuid=' . self::SITE . '&domain=rival.example&limit=2',
            'GET ' . self::BASE . '/web-pages?domain=rival.example&after=https%3A%2F%2Frival.example%2Fpricing&companySlug=acme',
        ], array_column($calls, 'route'));
    }

    public function testTrendsAndContentGapKeepMissingStateVisible(): void
    {
        $trends = $this->replay($calls, 'topicTrends')->webData()->getTopicTrends(self::SITE);
        $gap = $this->replay($calls, 'contentGap')->webData()->getContentGap(seed: 'seo');
        $unavailable = $this->replay($calls, 'contentGapUnavailable')->webData()->getContentGap();

        [$found, $noArticle, $failed] = $trends->trends;
        self::assertSame(SiteTopicTrend::STATUS_FOUND, $found->status);
        self::assertSame(0, $found->months[1]->views);
        self::assertSame(SiteTopicTrend::STATUS_NO_ARTICLE, $noArticle->status);
        self::assertNull($failed->checkedAt);
        self::assertSame('wikipedia answered HTTP 429', $failed->lastFailure);
        self::assertSame('seo', $gap->seed);
        self::assertTrue($gap->partial);
        self::assertSame(['rival.example'], $gap->topics[0]->competitors);
        self::assertSame('https://rival.example/blog/seo-checklist', $gap->topics[0]->pages[0]->url);
        self::assertSame(SiteContentGap::COVERAGE_UNAVAILABLE, $unavailable->ownCoverage);
        self::assertNull($unavailable->seed);
        self::assertSame([
            'GET ' . self::BASE . '/topic-trends?siteUuid=' . self::SITE,
            'GET ' . self::BASE . '/content-gap?seed=seo',
            'GET ' . self::BASE . '/content-gap',
        ], array_column($calls, 'route'));
    }

    public function testKeywordListsSaveDeleteAndCluster(): void
    {
        $request = new SiteKeywordListRequest('Pricing', ['pricing tool', 'price checker', 'seo audit'], 'pricing');
        $lists = $this->replay($calls, 'keywordLists')->webData()->listKeywordLists();
        $saved = $this->replay($calls, 'keywordList')->webData()->saveKeywordList($request, self::SITE);
        $this->replay($calls, 'keywordList', 204)->webData()->deleteKeywordList('Pricing', self::SITE, 'acme');
        $clusters = $this->replay($calls, 'keywordClusters')->webData()->getKeywordClusters('Pricing');

        self::assertNull($lists->lists[0]->seedTerm);
        self::assertSame('pricing', $saved->seedTerm);
        [$measured, $unmeasured] = $clusters->clusters;
        self::assertSame(12, $measured->clicks);
        self::assertSame(6.5, $measured->avgPosition);
        self::assertSame(0, $unmeasured->measuredKeywords);
        self::assertNull($unmeasured->clicks);
        self::assertNull($unmeasured->avgPosition);
        self::assertSame(6.5, $clusters->strikingDistance[0]->position);
        self::assertSame(['name' => 'Brand', 'keywords' => []], (new SiteKeywordListRequest('Brand', []))->serialise());
        self::assertSame([
            'GET ' . self::BASE . '/keyword-lists',
            'PUT ' . self::BASE . '/keyword-lists?siteUuid=' . self::SITE,
            'DELETE ' . self::BASE . '/keyword-lists?siteUuid=' . self::SITE . '&name=Pricing&companySlug=acme',
            'GET ' . self::BASE . '/keyword-clusters?name=Pricing',
        ], array_column($calls, 'route'));
        self::assertSame([null, self::fixtureArray('keywordListRequest'), null, null], array_column($calls, 'body'));
    }

    public function testKeywordListRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'keywordListNotFoundProblem' => SiteWebDataClient::KEYWORD_LIST_NOT_FOUND_CODE,
                'keywordListLimitProblem' => SiteWebDataClient::KEYWORD_LIST_LIMIT_CODE,
            ],
            static function (SiteDomainClient $client): void {
                $client->webData()->deleteKeywordList('Pricing');
            },
        );
    }
}
