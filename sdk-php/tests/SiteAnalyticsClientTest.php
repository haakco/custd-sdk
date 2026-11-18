<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteAnalyticsClient;
use HaakCo\Custd\Admin\SiteDomain\SiteAnalyticsConnection;
use HaakCo\Custd\Admin\SiteDomain\SiteAnalyticsUnavailable;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-analytics.json through the GA4 connection and report calls. */
final class SiteAnalyticsClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1/analytics';

    private static function fixtureFile(): string
    {
        return 'site-analytics.json';
    }

    public function testConnectReadAndDisconnect(): void
    {
        $connection = $this->replay($calls, 'connectionPending')->analytics()
            ->connectGA4('d-1', 'properties/123456789', 'acme');
        $report = $this->replay($calls, 'report')->analytics()->getAnalytics('d-1');
        $this->replay($calls, 'report', 204)->analytics()->disconnectGA4('d-1');

        self::assertSame(SiteAnalyticsConnection::STATUS_PENDING, $connection->status);
        self::assertNull($connection->lastImportedAt);
        self::assertSame(SiteAnalyticsConnection::STATUS_ACTIVE, $report->connection?->status);
        self::assertTrue($report->keyEventsRecorded);
        self::assertSame(34.0, $report->landingPages[0]->keyEvents);
        self::assertNull($report->landingPages[1]->keyEvents);
        self::assertSame(1060, $report->channels[0]->sessions);
        self::assertSame(SiteAnalyticsUnavailable::REPORT_ECOMMERCE, $report->unavailable[0]->report);
        self::assertSame([
            'PUT ' . self::BASE . '/ga4?companySlug=acme',
            'GET ' . self::BASE,
            'DELETE ' . self::BASE . '/ga4',
        ], array_column($calls, 'route'));
        self::assertSame([self::fixtureArray('connectionRequest'), null, null], array_column($calls, 'body'));
    }

    public function testReportsWithoutKeyEventsOrConnectionDecode(): void
    {
        $noKeyEvents = $this->replay($calls, 'reportNoKeyEvents')->analytics()->getAnalytics('d-1');
        $notConnected = $this->replay($calls, 'reportNotConnected')->analytics()->getAnalytics('d-1');

        self::assertFalse($noKeyEvents->keyEventsRecorded);
        self::assertNull($noKeyEvents->landingPages[0]->keyEvents);
        self::assertSame([], $noKeyEvents->keyEvents);
        self::assertNull($notConnected->connection);
        self::assertNull($notConnected->windowFrom);
        self::assertNull($notConnected->windowTo);
        self::assertSame([], $notConnected->landingPages);
    }

    public function testAnalyticsRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'propertyInvalidProblem' => SiteAnalyticsClient::ANALYTICS_PROPERTY_INVALID_CODE,
                'connectionNotFoundProblem' => SiteAnalyticsClient::ANALYTICS_CONNECTION_NOT_FOUND_CODE,
            ],
            static fn (SiteDomainClient $client): mixed => $client->analytics()->connectGA4('d-1', 'x'),
        );
    }
}
