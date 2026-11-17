<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\SiteLighthouseOutcome;
use HaakCo\Custd\Admin\SiteDomain\SiteLighthouseProfile;
use HaakCo\Custd\Admin\SiteDomain\SiteReport;
use HaakCo\Custd\Admin\SiteDomain\SiteReportShareRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteUptimeStatus;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class SiteReportingClientTest extends TestCase
{
    private const BASE = 'http://localhost:8080/api/v1/site-domains/domain-1';

    public function testReportKeepsTypedNestedValuesAndUnknownMeasurements(): void
    {
        $calls = [];
        $report = $this->client($calls)->getReport('domain-1', 'acme');

        self::assertSame('example.com', $report->host);
        self::assertSame(SiteReport::TEMPLATE_FULL, $report->template);
        self::assertSame(SiteUptimeStatus::Unknown, $report->uptime->status);
        self::assertNull($report->uptime->responseMs);
        self::assertNull($report->uptime->windows->last24h->upPercent);
        self::assertSame(90.0, $report->uptime->windows->last7d->upPercent);
        self::assertNull($report->uptime->days[0]->upPercent);
        self::assertNull($report->certificate->validTo);
        self::assertFalse($report->certificate->problem);
        self::assertSame(SiteLighthouseProfile::Desktop, $report->speed[0]->profile);
        self::assertSame(83, $report->speed[0]->scores->performance);
        self::assertNull($report->speed[0]->scores->accessibility);
        self::assertSame(0.01, $report->speed[0]->metrics->cumulativeLayoutShift);
        self::assertSame(2, $report->search->sources[0]->previous?->clicks);
        self::assertSame(200, $report->search->sources[0]->daily[0]->impressions);
        self::assertSame('hosting', $report->search->strikingDistance[0]->key);
        self::assertNull($report->audit->summary);
        self::assertSame('Add a title', $report->audit->findings[0]->fix);
        self::assertSame('GET ' . self::BASE . '/report?companySlug=acme', $calls[0]['route']);
    }

    public function testHistoryReadsPreserveFailedRunsAndAbsentTimings(): void
    {
        $calls = [];
        $client = $this->client($calls);
        $uptime = $client->getUptimeHistory('domain-1', 7, 'acme');
        $lighthouse = $client->getLighthouseHistory('domain-1');

        self::assertSame(7, $uptime->responseDays);
        self::assertNull($uptime->monitoredSince);
        self::assertNull($uptime->hours[0]->avgMs);
        self::assertNull($uptime->hours[0]->maxMs);
        self::assertSame('https://example.com/', $lighthouse->url);
        self::assertSame([], $lighthouse->pages);
        self::assertSame(SiteLighthouseOutcome::Failed, $lighthouse->runs[1]->outcome);
        self::assertSame('timeout', $lighthouse->runs[1]->failure);
        self::assertNull($lighthouse->runs[1]->scores->performance);
        self::assertSame([
            'GET ' . self::BASE . '/uptime-history?responseDays=7&companySlug=acme',
            'GET ' . self::BASE . '/lighthouse',
        ], array_column($calls, 'route'));
    }

    public function testSharesListCreateAndRevokeWithoutRetainingTheTokenInMetadata(): void
    {
        $calls = [];
        $client = $this->client($calls);
        $created = $client->createReportShare('domain-1', new SiteReportShareRequest(7));
        $shares = $client->listReportShares('domain-1');
        $client->revokeReportShare('domain-1', 'share-1', 'acme');

        self::assertSame('test-only-share-token', $created->token);
        self::assertSame('share-1', $created->share->shareUuid);
        self::assertSame($created->share->expiresAt, $shares->shares[0]->expiresAt);
        self::assertFalse(property_exists($shares->shares[0], 'token'));
        self::assertSame(['expiresInDays' => 7], $calls[0]['body']);
        self::assertSame([
            'POST ' . self::BASE . '/report-shares',
            'GET ' . self::BASE . '/report-shares',
            'DELETE ' . self::BASE . '/report-shares/share-1?companySlug=acme',
        ], array_column($calls, 'route'));
    }

    public function testSearchKeepsTrendsAndMissingPreviousPeriod(): void
    {
        $calls = [];
        $performance = $this->client($calls)->getSearchPerformance('domain-1');

        self::assertSame(2, $performance->sources[0]->previous?->clicks);
        self::assertNull($performance->sources[0]->previous->position);
        self::assertSame('2026-11-12', $performance->sources[0]->daily[0]->day);
        self::assertSame(4, $performance->sources[0]->daily[0]->clicks);
        self::assertSame('hosting', $performance->strikingDistance[0]->key);
    }

    public function testProviderRefusalIsNotAnEmptyReportOrRetriedShare(): void
    {
        $calls = 0;
        $transport = static function () use (&$calls): array {
            $calls++;
            return ['status' => 404, 'body' => '{"title":"Not found","status":404,"detail":"No such Site","code":"not_found"}'];
        };
        $client = new CustdClient('http://localhost:8080', 'token', ['admin_http_client' => $transport]);
        try {
            $client->adminSiteDomains()->createReportShare('domain-1', new SiteReportShareRequest());
            self::fail('Expected the Site refusal.');
        } catch (AdminProblemException $error) {
            self::assertSame(404, $error->status);
            self::assertSame(1, $calls);
        }
    }

    /** @param list<array{route: string, body: array<string, mixed>|null}> $calls */
    private function client(array &$calls): SiteDomainClient
    {
        $fixture = json_decode((string) file_get_contents(__DIR__ . '/../../contract-fixtures/site-insights-reporting.json'), false, 512, JSON_THROW_ON_ERROR);
        $transport = static function (string $method, string $url, ?array $body) use (&$calls, $fixture): array {
            $calls[] = ['route' => $method . ' ' . $url, 'body' => $body];
            if ($method === 'DELETE') {
                return ['status' => 204, 'body' => ''];
            }
            $key = match (basename((string) parse_url($url, PHP_URL_PATH))) {
                'report' => 'report',
                'uptime-history' => 'uptime',
                'lighthouse' => 'lighthouse',
                'report-shares' => $method === 'POST' ? 'created' : 'shares',
                'search' => 'search',
                default => throw new \LogicException('Unexpected test route: ' . $url),
            };
            return ['status' => $method === 'POST' ? 201 : 200, 'body' => json_encode($fixture->{$key}, JSON_THROW_ON_ERROR)];
        };
        return (new CustdClient('http://localhost:8080', 'token', ['admin_http_client' => $transport]))->adminSiteDomains();
    }
}
