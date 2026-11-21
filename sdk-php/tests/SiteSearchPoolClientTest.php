<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\SearchPoolBand;
use HaakCo\Custd\Admin\SiteDomain\SearchPoolSetting;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\Admin\SiteSearchPoolClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-search-pool.json through the shared search pool calls. */
final class SiteSearchPoolClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/search-pool';

    private static function fixtureFile(): string
    {
        return 'site-search-pool.json';
    }

    public function testJoinSendsTheAcceptedTermsAndLeaveSendsOnlyJoined(): void
    {
        $notJoined = $this->replay($calls, 'settingNotJoined')->searchPool()->getSearchPool();
        $joined = $this->replay($calls, 'settingJoined')->searchPool()
            ->setSearchPool(true, SiteSearchPoolClient::SEARCH_POOL_TERMS_VERSION, 'acme');
        $this->replay($calls, 'settingNotJoined')->searchPool()->setSearchPool(false, 'ignored-on-leave');

        self::assertFalse($notJoined->joined);
        self::assertNull($notJoined->joinedAt);
        self::assertNull($notJoined->acceptedTermsVersion);
        self::assertSame(SiteSearchPoolClient::SEARCH_POOL_TERMS_VERSION, $notJoined->termsVersion);
        self::assertSame(SiteSearchPoolClient::SEARCH_POOL_TERMS_VERSION, $joined->acceptedTermsVersion);
        self::assertSame(SearchPoolSetting::MIN_CONTRIBUTORS, $notJoined->minContributors);
        self::assertSame(SearchPoolSetting::MIN_IMPRESSIONS, $notJoined->minImpressions);
        self::assertSame(SearchPoolSetting::WINDOW_DAYS, $notJoined->windowDays);
        self::assertTrue($joined->joined);
        self::assertSame('2026-11-18T09:00:00Z', $joined->joinedAt);
        self::assertSame([
            'GET ' . self::BASE,
            'PUT ' . self::BASE . '?companySlug=acme',
            'PUT ' . self::BASE,
        ], array_column($calls, 'route'));
        self::assertSame(
            [null, self::fixtureArray('joinRequest'), self::fixtureArray('leaveRequest')],
            array_column($calls, 'body')
        );
    }

    public function testJoinWithoutTermsIsRefusedBeforeAnyRequest(): void
    {
        foreach ([null, ''] as $termsVersion) {
            $calls = null;
            try {
                $this->replay($calls, 'settingJoined')->searchPool()->setSearchPool(true, $termsVersion);
                self::fail('expected the join to be refused');
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls);
            }
        }
        $calls = null;
        try {
            $this->replay($calls, 'termsNotAcceptedProblem', 400)->searchPool()->setSearchPool(true, '2020-01-01');
            self::fail('expected a stale version to be refused');
        } catch (AdminProblemException $error) {
            self::assertSame(400, $error->status);
            self::assertSame('', $error->problem->code);
        }
    }

    public function testQueriesKeepZeroPositionsAndAbsentWindow(): void
    {
        $page = $this->replay($calls, 'queries')->searchPool()->listSearchPoolQueries();
        $before = $this->replay($calls, 'queriesBeforeRollup')->searchPool()->listSearchPoolQueries('pricing', 10);

        [$pricing, $free] = $page->queries;
        self::assertSame('2026-11-18T00:00:00Z', $page->computedAt);
        self::assertSame(SearchPoolBand::DEMAND_10K_100K, $pricing->demandBand);
        self::assertSame(35, $pricing->positions->top3);
        self::assertSame(SearchPoolBand::DEMAND_100_999, $free->demandBand);
        self::assertSame(0, $free->positions->top3);
        self::assertSame(0, $free->positions->top10);
        self::assertSame(75, $free->positions->beyond20);
        self::assertSame([], $before->queries);
        self::assertNull($before->from);
        self::assertNull($before->to);
        self::assertNull($before->computedAt);
        self::assertSame([
            'GET ' . self::BASE . '/queries',
            'GET ' . self::BASE . '/queries?limit=10&search=pricing',
        ], array_column($calls, 'route'));
    }

    public function testSearchPoolRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'notJoinedProblem' => SiteSearchPoolClient::SEARCH_POOL_NOT_JOINED_CODE,
                'siteBoundProblem' => SiteSearchPoolClient::SEARCH_POOL_SITE_BOUND_CODE,
                'settingInvalidProblem' => SiteSearchPoolClient::SEARCH_POOL_SETTING_INVALID_CODE,
                'queryInvalidProblem' => SiteSearchPoolClient::SEARCH_POOL_QUERY_INVALID_CODE,
            ],
            static fn (SiteDomainClient $client): mixed => $client->searchPool()->listSearchPoolQueries(),
        );
    }
}
