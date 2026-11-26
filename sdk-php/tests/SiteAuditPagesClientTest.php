<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteLighthouseProfile;
use HaakCo\Custd\Admin\SiteDomain\SiteRule;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SiteDomain\SiteAuditRun;
use HaakCo\Custd\Admin\SiteDomain\SiteAuditPageIndexability;

/** Replays contract-fixtures/site-audit-pages.json through the audit page, delta and Lighthouse page calls. */
final class SiteAuditPagesClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d%2F1';

    private static function fixtureFile(): string
    {
        return 'site-audit-pages.json';
    }

    public function testAuditPagesKeepAbsentAndZeroMeasurementsApart(): void
    {
        $list = $this->replay($calls, 'auditPages')->listAuditPages('d/1');
        $truncated = $this->replay($calls, 'auditPagesTruncated')->listAuditPages('d/1', 50, 50, 'acme');
        $notAudited = $this->replay($calls, 'auditPagesNotAudited')->listAuditPages('d/1');

        [$home, $redirected, $orphan] = $list->pages;
        self::assertSame(3, $list->total);
        self::assertSame(SiteAuditPageIndexability::INDEXABLE, $home->indexability);
        self::assertSame(0, $home->depth);
        self::assertNull($home->finalUrl);
        self::assertSame('https://example.com/new', $redirected->finalUrl);
        self::assertNull($orphan->depth);
        self::assertSame(0, $orphan->inboundLinks);
        self::assertTrue($truncated->truncated);
        self::assertSame(0, $truncated->pages[0]->status);
        self::assertNull($truncated->pages[0]->inboundLinks);
        self::assertNull($notAudited->auditedAt);
        self::assertSame([], $notAudited->pages);
        self::assertSame([
            'GET ' . self::BASE . '/audit-pages',
            'GET ' . self::BASE . '/audit-pages?offset=50&limit=50&companySlug=acme',
            'GET ' . self::BASE . '/audit-pages',
        ], array_column($calls, 'route'));
    }

    public function testAuditDeltaCarriesFindingsAndRunState(): void
    {
        $delta = $this->replay($calls, 'auditDelta')->getAuditDelta('d/1');
        $failed = $this->replay($calls, 'auditDeltaFailed')->getAuditDelta('d/1');
        $notAudited = $this->replay($calls, 'auditDeltaNotAudited')->getAuditDelta('d/1');

        self::assertSame(SiteAuditRun::COMPLETE, $delta->run);
        self::assertSame(SiteRule::CRAWL_BROKEN_FRAGMENT, $delta->new[0]->rule);
        self::assertSame(SiteRule::SITEMAP_BLOCKED_URL, $delta->reopened[0]->rule);
        self::assertTrue($delta->fixed[0]->history->fixed);
        self::assertSame(SiteAuditRun::FAILED, $failed->run);
        self::assertSame('the home page did not answer', $failed->failure);
        self::assertSame(SiteAuditRun::NOT_AUDITED, $notAudited->run);
        self::assertNull($notAudited->auditedAt);
        self::assertSame('GET ' . self::BASE . '/audit-delta', $calls[0]['route']);
    }

    public function testLighthousePageHistoryNamesThePageAndComparesEveryPage(): void
    {
        $history = $this->replay($calls, 'lighthousePageHistory')
            ->getLighthouseHistory('d/1', 7, url: 'https://example.com/pricing');

        [$home, $pricing] = $history->pages;
        self::assertSame('https://example.com/pricing', $history->url);
        self::assertSame(SiteLighthouseProfile::DESKTOP, $home->profile);
        self::assertSame(95, $home->previousScore);
        self::assertTrue($pricing->regressionOpen);
        self::assertNull($pricing->previousAt);
        self::assertNull($pricing->previousScore);
        self::assertSame(
            'GET ' . self::BASE . '/lighthouse?days=7&url=https%3A%2F%2Fexample.com%2Fpricing',
            $calls[0]['route']
        );
    }

    public function testLighthousePagesReadSetAndClear(): void
    {
        $request = self::fixtureArray('lighthousePagesRequest');
        /** @var list<string> $urls */
        $urls = $request['urls'];
        $read = $this->replay($calls, 'lighthousePagesEmpty')->getLighthousePages('d/1');
        $set = $this->replay($calls, 'lighthousePages')->setLighthousePages('d/1', $urls, 'acme');
        $this->replay($calls, 'lighthousePagesEmpty')->setLighthousePages('d/1', []);

        self::assertSame([], $read->urls);
        self::assertSame('https://example.com/', $set->homePage);
        self::assertSame($urls, $set->urls);
        self::assertSame(5, $set->maxPages);
        self::assertSame([
            'GET ' . self::BASE . '/lighthouse/pages',
            'PUT ' . self::BASE . '/lighthouse/pages?companySlug=acme',
            'PUT ' . self::BASE . '/lighthouse/pages',
        ], array_column($calls, 'route'));
        self::assertSame([null, $request, self::fixtureArray('lighthousePagesClearRequest')], array_column($calls, 'body'));
    }

    public function testLighthousePageRefusalCarriesItsCode(): void
    {
        $this->assertRefusals(
            ['lighthousePageNotExtraProblem' => SiteDomainClient::LIGHTHOUSE_PAGE_NOT_EXTRA_CODE],
            static fn (SiteDomainClient $client): mixed => $client->setLighthousePages('d/1', ['https://example.com/']),
        );
    }
}
