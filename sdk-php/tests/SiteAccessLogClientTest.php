<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteAccessLogClient;
use HaakCo\Custd\Admin\SiteDomain\SiteTrafficCount;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteTrafficDayCoverage;
use HaakCo\Custd\Admin\SiteDomain\SiteReferrerClass;
use HaakCo\Custd\Admin\SiteDomain\AccessLogHourStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteCrawlerIdentity;

/** Replays contract-fixtures/site-access-logs.json through the traffic, AI visibility and hour replay calls. */
final class SiteAccessLogClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1';

    private static function fixtureFile(): string
    {
        return 'site-access-logs.json';
    }

    public function testTrafficKeepsUnreadDaysApartFromZero(): void
    {
        $traffic = $this->replay($calls, 'traffic')->accessLogs()->getTraffic('d-1', '2026-11-15', '2026-11-16', 'acme');
        $empty = $this->replay($calls, 'trafficEmpty')->accessLogs()->getTraffic('d-1');

        [$missing, $partial] = $traffic->days;
        self::assertFalse($traffic->coverage->complete);
        self::assertSame(750, $traffic->totals?->p95Ms);
        self::assertSame(SiteTrafficDayCoverage::MISSING, $missing->coverage);
        self::assertNull($missing->requests);
        self::assertNull($missing->notFound);
        self::assertSame(SiteTrafficDayCoverage::PARTIAL, $partial->coverage);
        self::assertSame(0, $partial->notFound);
        self::assertSame(SiteTrafficCount::OTHER_KEY, $traffic->notFoundPaths[1]->key);
        self::assertSame(4100, $traffic->slowPaths[0]->maxMs);
        self::assertSame(SiteReferrerClass::AI, $traffic->referrers[1]->class);
        self::assertSame(SiteCrawlerIdentity::CLAIMS_TO_BE, $traffic->crawlers[1]->identity);
        self::assertNull($empty->totals);
        self::assertSame([], $empty->crawlers);
        self::assertSame([
            'GET ' . self::BASE . '/traffic?from=2026-11-15&to=2026-11-16&companySlug=acme',
            'GET ' . self::BASE . '/traffic',
        ], array_column($calls, 'route'));
    }

    public function testAIVisibilitySeparatesVerifiedFromClaimedCrawlers(): void
    {
        $visibility = $this->replay($calls, 'aiVisibility')->accessLogs()->getAIVisibility('d-1', '2026-11-15');

        self::assertSame(SiteCrawlerIdentity::VERIFIED, $visibility->crawlers[0]->identity);
        self::assertTrue($visibility->crawlers[0]->ai);
        self::assertSame('chatgpt.com', $visibility->assistants[0]->key);
        self::assertSame(30, $visibility->pages[0]->verifiedCrawlerHits);
        self::assertSame(24, $visibility->coverage->hoursMissing);
        self::assertSame('GET ' . self::BASE . '/ai-visibility?from=2026-11-15', $calls[0]['route']);
    }

    public function testReplaySendsTheHourInUtc(): void
    {
        $hour = new \DateTimeImmutable('2026-11-17T12:00:00+02:00');
        $replay = $this->replay($calls, 'accessLogHourReplay', 202)->accessLogs()->replayAccessLogHour($hour);

        self::assertSame(AccessLogHourStatus::FAILED, $replay->previousStatus);
        self::assertSame('2026-11-17T10:00:00Z', $replay->hourStart);
        self::assertSame('POST http://localhost:8080/api/v1/admin/access-log-hours/replay', $calls[0]['route']);
        self::assertSame(self::fixtureArray('accessLogHourReplayRequest'), $calls[0]['body']);
    }

    public function testReplayRefusalCarriesItsCode(): void
    {
        $this->assertRefusals(
            ['accessLogHourInvalidProblem' => SiteAccessLogClient::ACCESS_LOG_HOUR_INVALID_CODE],
            static fn (SiteDomainClient $client): mixed => $client->accessLogs()
                ->replayAccessLogHour(new \DateTimeImmutable('2020-01-01T00:00:00Z')),
        );
    }
}
