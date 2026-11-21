<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\SiteInsightsExport;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchMetricDay;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-export.json through the domain export calls. */
final class SiteExportClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains';

    private static function fixtureFile(): string
    {
        return 'site-export.json';
    }

    public function testExportDecodesEveryPartAndMetricsPage(): void
    {
        $export = $this->replay($calls, 'export')->export()->getExport('d-1', 'acme');
        $page = $this->replay($calls, 'searchMetrics')->export()->listSearchMetrics('d-1', 0, 2);
        $this->replay($calls, 'searchMetrics')->export()->listSearchMetrics('d-1');

        $fixture = self::fixtureValue('export');
        self::assertSame(SiteInsightsExport::SCHEMA, $export->schema);
        self::assertSame($fixture->domain->host, $export->domain->host);
        self::assertSame($fixture->monitoring->findingRows, $export->monitoring->findingRows);
        self::assertCount(count($fixture->monitoring->lighthouse), $export->monitoring->lighthouse);
        self::assertSame($fixture->search->metricRows, $export->search->metricRows);
        self::assertCount(count($fixture->reports->savedReports), $export->reports->savedReports);
        self::assertSame(2, $page->total);
        self::assertSame(SiteSearchMetricDay::DIMENSION_TOTAL, $page->rows[0]->dimension);
        self::assertSame('', $page->rows[0]->key);
        self::assertSame(4.2, $page->rows[1]->avgPosition);
        self::assertSame([
            'GET ' . self::BASE . '/d-1/export?companySlug=acme',
            'GET ' . self::BASE . '/d-1/export/search-metrics?offset=0&limit=2',
            'GET ' . self::BASE . '/d-1/export/search-metrics',
        ], array_column($calls, 'route'));
    }

    public function testInvalidMetricsPageIsAPlain400(): void
    {
        try {
            $this->replay($calls, 'searchMetricsInvalidProblem', 400)->export()->listSearchMetrics('d-1', -1);
            self::fail('expected the page to be refused');
        } catch (AdminProblemException $error) {
            self::assertSame(400, $error->status);
            self::assertSame('', $error->problem->code);
        }
    }
}
