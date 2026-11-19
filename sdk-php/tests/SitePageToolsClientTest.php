<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\CreateSiteDomainRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteFinding;
use HaakCo\Custd\Admin\SiteDomain\SiteGeneratedFix;
use HaakCo\Custd\Admin\SiteDomain\SiteMarket;
use HaakCo\Custd\Admin\SiteDomain\SitePageCheckRequest;
use HaakCo\Custd\Admin\SiteDomain\SitePageRecheckState;
use HaakCo\Custd\Admin\SiteDomain\SitePhraseUse;
use HaakCo\Custd\Admin\SiteDomain\SiteProjectContextRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteRemedy;
use HaakCo\Custd\Admin\SiteDomain\SiteRobotsDirective;
use HaakCo\Custd\Admin\SiteDomain\SiteRobotsSource;
use HaakCo\Custd\Admin\SiteDomain\SiteRobotsTestRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchDimension;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchInspectionStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
use HaakCo\Custd\Admin\SiteDomain\SiteWordingCompareRequest;
use HaakCo\Custd\Admin\SiteDomain\WordingObservationState;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-page-tools.json through the page tools, search rows, inspections and project context. */
final class SitePageToolsClientTest extends TestCase
{
    private const BASE = 'http://localhost:8080/api/v1/site-domains';

    public function testFindingRemediesCarryGeneratedCodeAndTolerateUnknownRules(): void
    {
        $generated = SiteFinding::fromPayload($this->fixture('findingWithGeneratedFix'));
        $unknown = SiteRemedy::fromPayload($this->fixture('remedyUnknownRule'));
        $listed = $this->client($calls, 'findingList', 'site-insights.json')->listFindings('d-1')->findings;

        self::assertSame(SiteRemedy::KIND_MARKUP, $generated->remedy->kind);
        self::assertSame(SiteGeneratedFix::FORMAT_HTML, $generated->remedy->generated?->format);
        self::assertSame('<link rel="canonical" href="https://example.com/plans">', $generated->remedy->generated->code);
        self::assertSame('', $unknown->kind);
        self::assertNull($unknown->generated);
        self::assertSame(SiteRemedy::KIND_CONTENT, $listed[0]->remedy->kind);
        self::assertSame(SiteRemedy::KIND_SERVER, $listed[1]->remedy->kind);
        self::assertNull($listed[1]->remedy->generated);
        self::assertSame('The page has no title.', $listed[0]->suggestion?->explanation);
        self::assertSame('Add a title that describes the page.', $listed[0]->suggestion?->nextStep);
        self::assertNull($listed[1]->suggestion);
        self::assertTrue($generated->recheckable);
        self::assertSame([true, false], [$listed[0]->recheckable, $listed[1]->recheckable]);
    }

    public function testSeveralRechecksAreReadInOneCallWithCommaJoinedIds(): void
    {
        $list = $this->client($calls, 'pageRecheckList')->listPageRechecks('d-1', ['r-1', 'r-2']);

        self::assertSame(
            [SitePageRecheckState::Checked, SitePageRecheckState::Failed],
            array_map(static fn ($recheck) => $recheck->state, $list->rechecks),
        );
        self::assertSame(['GET ' . self::BASE . '/d-1/page-rechecks?ids=r-1%2Cr-2'], array_column($calls, 'route'));
        self::assertSame(30, SiteDomainClient::PAGE_RECHECK_READ_LIMIT);
    }

    public function testCreateWithoutASiteSurfacesTheChoiceNeeded(): void
    {
        try {
            $this->client($calls, 'siteChoiceRequiredProblem', 'site-insights.json', 422)
                ->create(CreateSiteDomainRequest::forOwnSite('blog.example.com'));
            self::fail('expected the create to be refused');
        } catch (AdminProblemException $error) {
            self::assertSame(SiteDomainClient::SITE_CHOICE_REQUIRED_CODE, $error->problem->code);
        }
        self::assertSame(['host' => 'blog.example.com'], $calls[0]['body']);
    }

    public function testPageFactsAndDraftCheck(): void
    {
        $facts = $this->client($calls, 'pageFacts')->getPageFacts('d-1', 'https://example.com/plans', 'acme');
        $plain = $this->client($calls, 'pageFactsWithoutReadingEase')->getPageFacts('d-1', 'https://example.com/af/planne');
        $request = $this->fixture('pageCheckRequest');
        $check = $this->client($calls, 'pageCheck')->checkPage(
            'd-1',
            new SitePageCheckRequest((string) $request->url, (string) $request->html),
        );

        self::assertSame('Hosting plans for small teams', $facts->title);
        self::assertSame(1, $facts->headings[0]->level);
        self::assertSame('en-za', $facts->hreflang[0]->code);
        self::assertSame(57.1, $facts->readability->fleschReadingEase);
        self::assertSame('', $facts->canonical);
        self::assertNull($plain->readability->fleschReadingEase);
        self::assertSame(1, $plain->readability->sentences);
        self::assertSame(13, $check->page->wordCount);
        self::assertSame('ai.js-required', $check->findings[0]->rule);
        self::assertSame(SiteGeneratedFix::FORMAT_HTML, $check->findings[1]->remedy->generated?->format);
        self::assertSame(['url' => $request->url, 'html' => $request->html], $calls[2]['body']);
        self::assertNull($check->slug);
        self::assertNull($check->redirect);
        self::assertNull($check->phrase);
        self::assertSame('', $facts->shareImage);
        self::assertNull($facts->faqSchema);
        self::assertSame([
            'GET ' . self::BASE . '/d-1/page-facts?url=https%3A%2F%2Fexample.com%2Fplans&companySlug=acme',
            'GET ' . self::BASE . '/d-1/page-facts?url=https%3A%2F%2Fexample.com%2Faf%2Fplanne',
            'POST ' . self::BASE . '/d-1/page-check',
        ], array_column($calls, 'route'));
    }

    public function testContentScopeListsTheRulesCheckedAndAPageCheckHasNone(): void
    {
        $request = $this->fixture('pageCheckContentRequest');
        $check = $this->client($calls, 'pageCheckContent')->checkPage('d-1', new SitePageCheckRequest(
            (string) $request->url,
            (string) $request->html,
            scope: SitePageCheckRequest::SCOPE_CONTENT,
        ));
        $page = $this->client($calls, 'pageCheck')->checkPage('d-1', new SitePageCheckRequest('https://example.com/', '<p>x</p>'));

        self::assertSame(SitePageCheckRequest::SCOPE_CONTENT, $check->scope);
        self::assertContains('image.not-lazy', $check->checkedRules ?? []);
        self::assertNotContains('image.not-lazy', array_map(static fn ($finding): string => $finding->rule, $check->findings));
        self::assertSame(['url' => $request->url, 'html' => $request->html, 'scope' => 'content'], $calls[0]['body']);
        self::assertNull($page->scope);
        self::assertNull($page->checkedRules);
    }

    public function testDraftToolsSendPreviousUrlAndPhraseAndDecodeTheirAnswers(): void
    {
        $request = $this->fixture('pageCheckDraftToolsRequest');
        $check = $this->client($calls, 'pageCheckDraftTools')->checkPage('d-1', new SitePageCheckRequest(
            (string) $request->url,
            (string) $request->html,
            (string) $request->previousUrl,
            (string) $request->phrase,
        ));
        $facts = $this->client($calls, 'pageFactsShareImage')->getPageFacts('d-1', 'https://example.com/plans');
        $wordless = SitePhraseUse::fromPayload(
            json_decode('{"phrase":"x","inTitle":false,"inDescription":false,"inH1":false,"count":0,"wordCount":0,"densityPercent":0}', false, 512, JSON_THROW_ON_ERROR),
        );

        self::assertSame((array) $request, $calls[0]['body']);
        self::assertSame('cafe-hosting-plans-for-small-teams', $check->slug);
        self::assertSame(SiteGeneratedFix::FORMAT_REDIRECT, $check->redirect?->format);
        self::assertSame(2, $check->phrase?->count);
        self::assertTrue($check->phrase->inDescription);
        self::assertSame(3.85, $check->phrase->densityPercent);
        self::assertNull($wordless->densityPercent);
        self::assertSame('https://example.com/img/team.jpg', $facts->shareImage);
        self::assertStringContainsString('FAQPage', (string) $facts->faqSchema?->code);
    }

    public function testWordingCompareLeavesTheShareOfUncomparedTextsNull(): void
    {
        $request = $this->fixture('wordingCompareRequest');
        $compared = $this->client($calls, 'wordingCompare')
            ->compareWording('d-1', new SiteWordingCompareRequest((string) $request->first, (string) $request->second));
        $short = $this->client($calls, 'wordingCompareNotCompared')
            ->compareWording('d-1', new SiteWordingCompareRequest('a', 'b'));

        self::assertSame((array) $request, $calls[0]['body']);
        self::assertSame(91, $compared->sharedPercent);
        self::assertTrue($compared->nearDuplicate);
        self::assertFalse($short->compared);
        self::assertNull($short->sharedPercent);
        self::assertSame(200, $short->minWords);
        self::assertSame(
            ['POST ' . self::BASE . '/d-1/wording-compare', 'POST ' . self::BASE . '/d-1/wording-compare'],
            array_column($calls, 'route'),
        );
    }

    public function testObservedWordingUsesSavedPagesAndDistinguishesUnavailableAndShort(): void
    {
        $first = 'https://example.com/plans';
        $second = 'https://example.com/support';
        $ready = $this->client($calls, 'observedWording')->comparePageWording('d-1', $first, $second, 'acme');
        self::assertSame(WordingObservationState::Ready, $ready->first->state);
        self::assertSame('2026-11-18T11:00:00Z', $ready->first->observedAt);
        self::assertSame(96, $ready->comparison?->sharedPercent);
        self::assertSame([null], array_column($calls, 'body'));
        self::assertSame(
            ['GET ' . self::BASE . '/d-1/page-wording?firstUrl=https%3A%2F%2Fexample.com%2Fplans'
                . '&secondUrl=https%3A%2F%2Fexample.com%2Fsupport&companySlug=acme'],
            array_column($calls, 'route')
        );

        $missing = $this->client($calls, 'observedWordingUnavailable')->comparePageWording('d-1', $first, $second);
        self::assertSame(WordingObservationState::Unavailable, $missing->first->state);
        self::assertSame(WordingObservationState::Unread, $missing->second->state);
        self::assertNull($missing->second->observedAt);
        self::assertNull($missing->comparison);

        $short = $this->client($calls, 'observedWordingShort')->comparePageWording('d-1', $first, $second);
        self::assertSame(WordingObservationState::Short, $short->first->state);
        self::assertNotNull($short->comparison);
        self::assertSame(80, $short->comparison->firstWords);
        self::assertNull($short->comparison->sharedPercent);
    }

    public function testPageRechecksQueueAndPoll(): void
    {
        $queued = $this->client($calls, 'pageRecheckQueued', status: 202)->requestPageRecheck('d-1', 'https://example.com/plans');
        $checked = $this->client($calls, 'pageRecheckChecked')->getPageRecheck('d-1', 'r-1', 'acme');
        $failed = $this->client($calls, 'pageRecheckFailed')->getPageRecheck('d-1', 'r-2');

        self::assertSame(SitePageRecheckState::Queued, $queued->state);
        self::assertNull($queued->checkedAt);
        self::assertSame([], $queued->openRules);
        self::assertSame(['canonical.missing'], $checked->openRules);
        self::assertSame(['title.missing'], $checked->fixedRules);
        self::assertSame('2026-11-17T08:01:00Z', $checked->checkedAt);
        self::assertSame('the page answered HTTP 503', $failed->failure);
        self::assertSame((array) $this->fixture('pageRecheckRequest'), $calls[0]['body']);
        self::assertSame([
            'POST ' . self::BASE . '/d-1/page-rechecks',
            'GET ' . self::BASE . '/d-1/page-rechecks/r-1?companySlug=acme',
            'GET ' . self::BASE . '/d-1/page-rechecks/r-2',
        ], array_column($calls, 'route'));
    }

    public function testRobotsTesterSendsPastedFileOrOmitsIt(): void
    {
        $request = $this->fixture('robotsTestRequest');
        $pasted = $this->client($calls, 'robotsTest')->testRobots('d-1', new SiteRobotsTestRequest(
            (string) $request->url,
            (string) $request->userAgent,
            (string) $request->robotsTxt,
        ));
        $live = $this->client($calls, 'robotsTestLiveMissing')->testRobots('d-1', new SiteRobotsTestRequest('/', 'GPTBot'));

        self::assertFalse($pasted->allowed);
        self::assertSame(SiteRobotsSource::Pasted, $pasted->source);
        self::assertNull($pasted->robotsStatus);
        self::assertSame(['*'], $pasted->groups);
        self::assertSame(SiteRobotsDirective::Disallow, $pasted->rule?->directive);
        self::assertSame(2, $pasted->rule->line);
        self::assertTrue($live->allowed);
        self::assertSame(SiteRobotsSource::Live, $live->source);
        self::assertSame(404, $live->robotsStatus);
        self::assertNull($live->rule);
        self::assertSame('robots.txt is missing, so every URL is allowed', $live->note);
        self::assertSame((array) $request, $calls[0]['body']);
        self::assertSame(['url' => '/', 'userAgent' => 'GPTBot'], $calls[1]['body']);
        self::assertSame('POST ' . self::BASE . '/d-1/robots-test', $calls[1]['route']);
    }

    public function testSearchRowsPageWithUnavailableProvidersAndAbsentPosition(): void
    {
        $rows = $this->client($calls, 'searchRows')->listSearchRows('d-1', SiteSearchDimension::Country);
        $bing = $this->client($calls, 'searchRowsNoPosition')
            ->listSearchRows('d-1', SiteSearchDimension::Query, SiteSearchProvider::Bing, 7, 100, 50, 'acme');

        self::assertSame(SiteSearchDimension::Country, $rows->dimension);
        self::assertNull($rows->provider);
        self::assertSame(6.5, $rows->rows[0]->totals->position);
        self::assertSame(SiteSearchProvider::Bing, $rows->unavailable[0]->provider);
        self::assertSame(SiteSearchProvider::Bing, $bing->provider);
        self::assertSame(101, $bing->total);
        self::assertNull($bing->rows[0]->totals->position);
        self::assertSame(0.0, $bing->rows[0]->totals->ctr);
        self::assertSame([], $bing->unavailable);
        self::assertSame([
            'GET ' . self::BASE . '/d-1/search/rows?dimension=country',
            'GET ' . self::BASE . '/d-1/search/rows?dimension=query&provider=bing&days=7&offset=100&limit=50&companySlug=acme',
        ], array_column($calls, 'route'));
    }

    public function testSearchInspectionsQueueAndList(): void
    {
        $queued = $this->client($calls, 'searchInspectionQueued', status: 202)
            ->requestSearchInspection('d-1', 'https://example.com/plans');
        $list = $this->client($calls, 'searchInspectionList')->listSearchInspections('d-1', 'acme');

        self::assertSame(SiteSearchInspectionStatus::Queued, $queued->status);
        self::assertNull($queued->inspectedAt);
        self::assertNull($queued->verdict);
        self::assertSame(200, $list->dailyLimit);
        self::assertSame(3, $list->usedToday);
        self::assertSame('PASS', $list->inspections[0]->verdict);
        self::assertSame('2026-11-15T03:00:00Z', $list->inspections[0]->lastCrawlAt);
        self::assertNull($list->inspections[1]->lastCrawlAt);
        self::assertNull($list->inspections[0]->mobileUsabilityVerdict);
        self::assertSame(SiteSearchInspectionStatus::Failed, $list->inspections[2]->status);
        self::assertSame((array) $this->fixture('searchInspectionRequest'), $calls[0]['body']);
        self::assertSame([
            'POST ' . self::BASE . '/d-1/search/inspections',
            'GET ' . self::BASE . '/d-1/search/inspections?companySlug=acme',
        ], array_column($calls, 'route'));
    }

    public function testProjectContextReadAndReplace(): void
    {
        $empty = $this->client($calls, 'projectContextEmpty')->getProjectContext();
        $set = $this->client($calls, 'projectContext')->setProjectContext('s-1', new SiteProjectContextRequest(
            ['Example Hosting'],
            ['competitor.example'],
            [new SiteMarket('ZA', 'en')],
        ), 'acme');
        $this->client($calls, 'projectContextEmpty')->setProjectContext(null, new SiteProjectContextRequest());

        self::assertSame([], $empty->brandNames);
        self::assertNull($empty->updatedAt);
        self::assertSame('ZA', $set->markets[0]->country);
        self::assertSame('2026-11-17T08:00:00Z', $set->updatedAt);
        self::assertSame(json_decode((string) json_encode($this->fixture('projectContextRequest')), true), $calls[1]['body']);
        self::assertSame(['brandNames' => [], 'competitorDomains' => [], 'markets' => []], $calls[2]['body']);
        self::assertSame([
            'GET ' . self::BASE . '/project-context',
            'PUT ' . self::BASE . '/project-context?siteUuid=s-1&companySlug=acme',
            'PUT ' . self::BASE . '/project-context',
        ], array_column($calls, 'route'));
    }

    public function testProjectContextSendsExplicitHackerNewsChoice(): void
    {
        $domains = $this->client($calls, 'projectContextEmpty');
        $domains->setProjectContext(null, new SiteProjectContextRequest(hackerNewsEnabled: true));
        $disabled = $domains->setProjectContext(null, new SiteProjectContextRequest(hackerNewsEnabled: false));
        $payload = $this->fixture('projectContext');
        $payload->hackerNewsEnabled = true;

        self::assertSame(true, $calls[0]['body']['hackerNewsEnabled']);
        self::assertSame(false, $calls[1]['body']['hackerNewsEnabled']);
        self::assertFalse($disabled->hackerNewsEnabled);
        self::assertTrue(\HaakCo\Custd\Admin\SiteDomain\SiteProjectContext::fromPayload($payload)->hackerNewsEnabled);
    }

    public function testRefusalsCarryNamedProblemCodes(): void
    {
        $cases = [
            'pageNotOnDomainProblem' => SiteDomainClient::PAGE_NOT_ON_DOMAIN_CODE,
            'pageRecheckLimitProblem' => SiteDomainClient::PAGE_RECHECK_LIMIT_CODE,
            'searchInspectionUrlInvalidProblem' => SiteDomainClient::SEARCH_INSPECTION_URL_INVALID_CODE,
            'searchInspectionNotConnectedProblem' => SiteDomainClient::SEARCH_INSPECTION_NOT_CONNECTED_CODE,
            'searchInspectionLimitProblem' => SiteDomainClient::SEARCH_INSPECTION_LIMIT_CODE,
        ];
        $problem = $this->fixture('pageNotReadProblem');
        try {
            $this->client($calls, 'pageNotReadProblem', status: (int) $problem->status)->getPageFacts('d-1', 'https://example.com/');
            self::fail('expected pageNotReadProblem to be refused');
        } catch (AdminProblemException $error) {
            self::assertSame(404, $error->status);
            self::assertSame(SiteDomainClient::PAGE_NOT_READ_CODE, $error->problem->code);
        }
        foreach ($cases as $key => $code) {
            $problem = $this->fixture($key);
            try {
                $this->client($calls, $key, status: (int) $problem->status)->requestPageRecheck('d-1', 'https://example.com/');
                self::fail("expected {$key} to be refused");
            } catch (AdminProblemException $error) {
                self::assertSame($problem->status, $error->status);
                self::assertSame($code, $error->problem->code);
            }
        }
    }

    private function fixture(string $key, string $file = 'site-page-tools.json'): \stdClass
    {
        $fixture = json_decode(
            (string) file_get_contents(__DIR__ . '/../../contract-fixtures/' . $file),
            false,
            512,
            JSON_THROW_ON_ERROR,
        );
        self::assertInstanceOf(\stdClass::class, $fixture);
        $value = $fixture->{$key};
        self::assertInstanceOf(\stdClass::class, $value);

        return $value;
    }

    /**
     * client answers every request with one fixture entry and appends each call to $calls.
     *
     * @param list<array{route: string, body: array<string, mixed>|null}>|null $calls
     * @param-out list<array{route: string, body: array<string, mixed>|null}> $calls
     */
    private function client(?array &$calls, string $key, string $file = 'site-page-tools.json', int $status = 200): SiteDomainClient
    {
        $calls ??= [];
        $body = json_encode($this->fixture($key, $file), JSON_THROW_ON_ERROR);
        $transport = static function (string $method, string $url, ?array $request) use (&$calls, $body, $status): array {
            $calls[] = ['route' => $method . ' ' . $url, 'body' => $request];

            return ['status' => $status, 'body' => $body];
        };

        return (new CustdClient('http://localhost:8080', 'token', ['admin_http_client' => $transport]))->adminSiteDomains();
    }
}
