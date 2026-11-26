<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteInsightsTaskStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchConnectionStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-insights-tasks.json through the task read and the search import retry. */
final class SiteInsightsTasksTest extends TestCase
{
    use SiteFixtureReplay;

    private static function fixtureFile(): string
    {
        return 'site-insights-tasks.json';
    }

    public function testTasksReadIsASystemAdminRouteWithOptionalRunTimes(): void
    {
        $read = $this->replay($calls, 'tasks')->getSiteInsightsTasks();

        [$checks, $imports, $graph] = $read->tasks;
        self::assertSame('2026-11-18T12:00:00Z', $read->generatedAt);
        self::assertSame(SiteInsightsTaskStatus::TASK_SITE_CHECKS, $checks->taskName);
        self::assertSame(3, $checks->backlog[0]->count);
        self::assertNull($checks->lastFailure);
        self::assertSame(SiteInsightsTaskStatus::TASK_SITE_SEARCH_IMPORTS, $imports->taskName);
        self::assertNull($imports->nextRunAt);
        self::assertSame('search console: quota exceeded', $imports->lastFailure);
        self::assertSame(SiteInsightsTaskStatus::TASK_SITE_WEB_GRAPH, $graph->taskName);
        self::assertFalse($graph->registered);
        self::assertNull($graph->lastRunAt);
        self::assertSame([], $graph->backlog);
        self::assertSame(['GET http://localhost:8080/api/v1/admin/site-insights/tasks'], array_column($calls, 'route'));
    }

    public function testRetryReimportsAFailingConnection(): void
    {
        $connection = $this->replay($calls, 'searchConnectionRetried')
            ->retrySearch('d-1', SiteSearchProvider::GOOGLE, 'acme');

        self::assertSame(SiteSearchConnectionStatus::FAILING, $connection->status);
        self::assertSame(
            ['POST http://localhost:8080/api/v1/site-domains/d-1/search/google/retry?companySlug=acme'],
            array_column($calls, 'route'),
        );
        self::assertSame([null], array_column($calls, 'body'));
        $this->assertRefusals(
            ['retryNotFailingProblem' => SiteDomainClient::SEARCH_RETRY_NOT_FAILING_CODE],
            static fn (SiteDomainClient $client): mixed => $client->retrySearch('d-1', SiteSearchProvider::BING),
        );
    }
}
