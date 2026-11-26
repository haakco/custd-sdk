<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SearchPoolBand;
use HaakCo\Custd\Admin\SiteDomain\SiteTrackedKeyword;
use HaakCo\Custd\Admin\SiteDomain\SiteTrackKeywordRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteUpdateTrackedKeywordRequest;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\Admin\SiteRankingClient;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteRankObservationState;
use HaakCo\Custd\Admin\SiteDomain\SiteRankingsSource;
use HaakCo\Custd\Admin\SiteDomain\SiteTrackedKeywordStatus;
use HaakCo\Custd\Admin\SiteDomain\SearchPoolDemandBand;
use HaakCo\Custd\Admin\SiteDomain\SearchPoolAccess;

/** Replays contract-fixtures/site-rankings.json through the rank tracking calls. */
final class SiteRankingClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1/rankings';
    private const KEYWORD = '6512bd43-d9ca-46a1-b2c3-d4e5f6a7b866';

    private static function fixtureFile(): string
    {
        return 'site-rankings.json';
    }

    public function testRankingsKeepNotRankingDaysWithoutAPosition(): void
    {
        $rankings = $this->replay($calls, 'rankings')->rankings()->getRankings('d-1', 3, 'acme');
        $failing = $this->replay($calls, 'rankingsFailing')->rankings()->getRankings('d-1');
        $notConnected = $this->replay($calls, 'rankingsNotConnected')->rankings()->getRankings('d-1');

        [$tracked, $paused] = $rankings->keywords;
        [$noData, $notRanking, $ranking] = $tracked->observations;
        self::assertSame(SiteRankingsSource::ACTIVE, $rankings->source);
        self::assertSame(50, $rankings->maxKeywords);
        self::assertSame(SiteTrackedKeyword::DEVICE_MOBILE, $tracked->device);
        self::assertSame(7.4, $tracked->latest->position);
        self::assertSame(SiteRankObservationState::NO_DATA, $noData->state);
        self::assertSame(SiteRankObservationState::NOT_RANKING, $notRanking->state);
        self::assertNull($notRanking->position);
        self::assertNull($notRanking->rankingUrl);
        self::assertSame(0, $notRanking->clicks);
        self::assertSame('https://example.com/pricing', $ranking->rankingUrl);
        self::assertSame(SiteTrackedKeywordStatus::PAUSED, $paused->status);
        self::assertSame(SiteTrackedKeyword::ALL, $paused->country);
        self::assertSame(SearchPoolAccess::JOINED, $rankings->pool);
        self::assertSame(SearchPoolDemandBand::BAND_10K_100K, $tracked->pool?->demandBand);
        self::assertSame(40, $tracked->pool->positions->top10);
        self::assertSame(10, $tracked->pool->positions->beyond20);
        self::assertNull($paused->pool);
        self::assertSame(SearchPoolAccess::NOT_JOINED, $failing->pool);
        self::assertSame(SearchPoolAccess::NOT_JOINED, $notConnected->pool);
        self::assertSame('Search Console refused the token', $failing->sourceFailure);
        self::assertSame(SiteRankingsSource::NOT_CONNECTED, $notConnected->source);
        self::assertNull($notConnected->sourceFailure);
        self::assertSame([
            'GET ' . self::BASE . '?days=3&companySlug=acme',
            'GET ' . self::BASE,
            'GET ' . self::BASE,
        ], array_column($calls, 'route'));
    }

    public function testRankingsFromBeforeThePoolHaveNoPool(): void
    {
        $rankings = $this->replay($calls, 'rankingsBeforePool')->rankings()->getRankings('d-1');

        self::assertNull($rankings->pool);
        self::assertSame([null, null], array_map(
            static fn (SiteTrackedKeyword $keyword): ?SearchPoolBand => $keyword->pool,
            $rankings->keywords
        ));
    }

    public function testTrackUpdateAndUntrackSendOnlyTheirFields(): void
    {
        $tracked = $this->replay($calls, 'trackedKeyword', 201)->rankings()
            ->trackKeyword('d-1', new SiteTrackKeywordRequest('Pricing Tool', 'zaf', SiteTrackedKeyword::DEVICE_MOBILE));
        $updated = $this->replay($calls, 'updatedTrackedKeyword')->rankings()
            ->updateTrackedKeyword('d-1', self::KEYWORD, new SiteUpdateTrackedKeywordRequest(false, 5), 'acme');
        $this->replay($calls, 'trackedKeyword', 204)->rankings()->untrackKeyword('d-1', self::KEYWORD);

        self::assertSame('pricing tool', $tracked->keyword);
        self::assertSame(SiteTrackKeywordRequest::DEFAULT_NOTIFY_POSITION, $tracked->notifyPosition);
        self::assertSame(SiteTrackedKeywordStatus::ACTIVE, $updated->status);
        self::assertSame(5, $updated->notifyPosition);
        self::assertSame([
            'POST ' . self::BASE . '/keywords',
            'PUT ' . self::BASE . '/keywords/' . self::KEYWORD . '?companySlug=acme',
            'DELETE ' . self::BASE . '/keywords/' . self::KEYWORD,
        ], array_column($calls, 'route'));
        self::assertSame(
            [self::fixtureArray('trackKeywordRequest'), self::fixtureArray('updateTrackedKeywordRequest'), null],
            array_column($calls, 'body')
        );
    }

    public function testPausingWithoutAPositionKeepsTheStoredOne(): void
    {
        $this->replay($calls, 'updatedTrackedKeyword')->rankings()
            ->updateTrackedKeyword('d-1', self::KEYWORD, new SiteUpdateTrackedKeywordRequest(true));

        self::assertSame(self::fixtureArray('updateTrackedKeywordPauseRequest'), $calls[0]['body']);
    }

    public function testRankingRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'trackedKeywordInvalidProblem' => SiteRankingClient::TRACKED_KEYWORD_INVALID_CODE,
                'trackedKeywordLimitProblem' => SiteRankingClient::TRACKED_KEYWORD_LIMIT_CODE,
                'trackedKeywordDuplicateProblem' => SiteRankingClient::TRACKED_KEYWORD_DUPLICATE_CODE,
                'trackedKeywordNotFoundProblem' => SiteRankingClient::TRACKED_KEYWORD_NOT_FOUND_CODE,
                'rankingsDaysInvalidProblem' => SiteRankingClient::RANKINGS_DAYS_INVALID_CODE,
            ],
            static fn (SiteDomainClient $client): mixed => $client->rankings()->getRankings('d-1', 91),
        );
    }
}
