<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SavedSiteReportRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteReportShareRequest;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteReportTemplate;

/** Replays contract-fixtures/site-saved-reports.json through the report template, saved report and share calls. */
final class SiteSavedReportsClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1';
    private const REPORT = 'c9f0f895-fb98-4b91-a2f1-2b0d6e3c5a33';

    private static function fixtureFile(): string
    {
        return 'site-saved-reports.json';
    }

    public function testReportTemplateAndDaysAreQueryParameters(): void
    {
        $report = $this->replay($calls, 'executiveReport')
            ->getReport('d-1', 'acme', SiteReportTemplate::EXECUTIVE, 14);

        self::assertSame(SiteReportTemplate::EXECUTIVE, $report->template);
        self::assertSame(14, $report->search->days);
        self::assertSame('GET ' . self::BASE . '/report?template=executive&days=14&companySlug=acme', $calls[0]['route']);
    }

    public function testSavedReportsListSaveReadReplaceAndDelete(): void
    {
        $request = new SavedSiteReportRequest('November client summary', SiteReportTemplate::EXECUTIVE, 14);
        $list = $this->replay($calls, 'savedReportList')->listSavedReports('d-1');
        $empty = $this->replay($calls, 'savedReportListEmpty')->listSavedReports('d-1');
        $saved = $this->replay($calls, 'savedReport', 201)->saveReport('d-1', $request);
        $read = $this->replay($calls, 'savedReport')->getSavedReport('d-1', self::REPORT, 'acme');
        $this->replay($calls, 'savedReport')->replaceSavedReport('d-1', self::REPORT, $request);
        $this->replay($calls, 'savedReport', 204)->deleteSavedReport('d-1', self::REPORT);

        self::assertSame(20, $list->maxReports);
        self::assertSame(0, $list->reports[1]->liveShares);
        self::assertSame(SiteReportTemplate::FULL, $list->reports[1]->template);
        self::assertSame([], $empty->reports);
        self::assertSame('November client summary', $saved->name);
        self::assertSame(1, $saved->liveShares);
        self::assertSame(SiteReportTemplate::EXECUTIVE, $saved->report->template);
        self::assertSame(self::REPORT, $read->reportUuid);
        self::assertSame(['name' => 'Report'], (new SavedSiteReportRequest('Report'))->serialise());
        self::assertSame([
            'GET ' . self::BASE . '/saved-reports',
            'GET ' . self::BASE . '/saved-reports',
            'POST ' . self::BASE . '/saved-reports',
            'GET ' . self::BASE . '/saved-reports/' . self::REPORT . '?companySlug=acme',
            'PUT ' . self::BASE . '/saved-reports/' . self::REPORT,
            'DELETE ' . self::BASE . '/saved-reports/' . self::REPORT,
        ], array_column($calls, 'route'));
        $request = self::fixtureArray('savedReportRequest');
        self::assertSame([null, null, $request, null, $request, null], array_column($calls, 'body'));
    }

    public function testSharesNameTheSavedReportTheyOpen(): void
    {
        $created = $this->replay($calls, 'reportShareCreated', 201)
            ->createReportShare('d-1', new SiteReportShareRequest(14, self::REPORT));
        $shares = $this->replay($calls, 'reportShares')->listReportShares('d-1');

        self::assertSame(self::REPORT, $created->share->reportUuid);
        self::assertSame(self::fixtureArray('reportShareRequest'), $calls[0]['body']);
        self::assertSame(self::REPORT, $shares->shares[0]->reportUuid);
        self::assertNull($shares->shares[1]->reportUuid);
    }

    public function testSavedReportRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'savedReportNameTakenProblem' => SiteDomainClient::SAVED_REPORT_NAME_TAKEN_CODE,
                'savedReportLimitProblem' => SiteDomainClient::SAVED_REPORT_LIMIT_CODE,
            ],
            static fn (SiteDomainClient $client): mixed => $client->saveReport('d-1', new SavedSiteReportRequest('x')),
        );
    }
}
