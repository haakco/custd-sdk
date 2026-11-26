<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteNextAction;
use HaakCo\Custd\Admin\SiteDomain\SiteNextActions;
use HaakCo\Custd\Admin\SiteDomain\SiteNextActionTarget;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteReportTemplate;

/** Replays contract-fixtures/site-next-actions.json through the next-actions calls and the report. */
final class SiteNextActionClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains';

    private static function fixtureFile(): string
    {
        return 'site-next-actions.json';
    }

    public function testNextActionsDecodeEveryShape(): void
    {
        $next = $this->replay($calls, 'nextActions')->nextActions()->forDomain('d-1');
        $findings = $this->replay($calls, 'nextActionsFindings')->nextActions()->forDomain('d-1', 'acme');

        self::assertSame('down', $next->status);
        self::assertSame('own-key', $next->aiMode);
        self::assertSame(6, $next->actionCount);
        self::assertCount(SiteNextActions::MAX_ACTIONS, $next->actions);
        self::assertSame(
            [SiteNextAction::KIND_OUTAGE, SiteNextAction::KIND_CERTIFICATE, SiteNextAction::KIND_RECONNECT_SEARCH],
            array_map(static fn (SiteNextAction $action): string => $action->kind, $next->actions),
        );
        self::assertSame([SiteNextActions::NOT_CHECKED_SEARCH], $next->notChecked);
        self::assertNull($next->actions[0]->rule);
        self::assertSame(2, $findings->actions[0]->affectedCount);
        self::assertSame(SiteNextActionTarget::PLACE_FINDING, $findings->actions[0]->target->place);
        self::assertSame(SiteNextActionTarget::PLACE_PAGE, $findings->actions[1]->target->place);
        self::assertTrue($findings->actions[1]->recheckable);
        self::assertSame('https://example.com/contact', $findings->actions[1]->target->pageUrl);
        self::assertSame([
            'GET ' . self::BASE . '/d-1/next-actions',
            'GET ' . self::BASE . '/d-1/next-actions?companySlug=acme',
        ], array_column($calls, 'route'));
    }

    public function testPortfolioIsWorstFirstAndAnUnknownKindDecodes(): void
    {
        $summary = $this->replay($calls, 'portfolioSummary')->nextActions()->portfolioSummary();
        $pending = $this->replay($calls, 'nextActionsPending')->nextActions()->forDomain('d-1');

        self::assertSame(
            [SiteNextAction::KIND_VERIFY, SiteNextAction::KIND_OUTAGE, SiteNextAction::KIND_FINDING, null],
            array_map(static fn ($row): ?string => $row->firstAction?->kind, $summary->domains),
        );
        self::assertSame(4, $summary->domains[1]->openFindings->high);
        self::assertNull($summary->domains[3]->firstAction);
        self::assertSame(SiteNextAction::KIND_VERIFY, $pending->actions[0]->kind);
        self::assertSame('GET ' . self::BASE . '/portfolio-summary', $calls[0]['route']);

        $unknown = self::fixtureValue('nextActionsPending');
        $unknown->actions[0]->kind = 'suggestion-ready';
        self::assertSame('suggestion-ready', SiteNextActions::fromPayload($unknown)->actions[0]->kind);
    }

    public function testReportCarriesTheReadsFirstThree(): void
    {
        $report = $this->replay($calls, 'reportWithNextActions')->getReport('d-1');
        $read = $this->replay($calls, 'nextActions')->nextActions()->forDomain('d-1');

        self::assertEquals($read->actions, $report->nextActions);
        self::assertSame(SiteReportTemplate::EXECUTIVE, $report->template);
    }
}
