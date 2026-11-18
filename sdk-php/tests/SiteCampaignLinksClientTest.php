<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteCampaignLinkClient;
use HaakCo\Custd\Admin\SiteDomain\SiteCampaignLinkList;
use HaakCo\Custd\Admin\SiteDomain\SiteCampaignLinkRequest;
use HaakCo\Custd\Admin\SiteDomainClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-campaign-links.json through a domain's saved campaign links. */
final class SiteCampaignLinksClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1/campaign-links';

    private static function fixtureFile(): string
    {
        return 'site-campaign-links.json';
    }

    public function testListCreateAndArchiveSendTheirRoutes(): void
    {
        $request = self::fixtureValue('campaignLinkRequest');
        $list = $this->replay($calls, 'campaignLinkListWithArchived')->campaignLinks()->listCampaignLinks('d-1', true);
        $this->replay($calls, 'campaignLinkListWithArchived')->campaignLinks()->listCampaignLinks('d-1');
        $link = $this->replay($calls, 'campaignLink', 201)->campaignLinks()->createCampaignLink('d-1', new SiteCampaignLinkRequest(
            (string) $request->url,
            (string) $request->source,
            (string) $request->medium,
            (string) $request->campaign,
            (string) $request->term,
            (string) $request->content,
        ));
        $this->replay($calls, 'campaignLink', 201)->campaignLinks()
            ->createCampaignLink('d-1', new SiteCampaignLinkRequest('https://example.com/', 'google', 'cpc', 'sale'));
        $archived = $this->replay($calls, 'campaignLinkArchived')->campaignLinks()->archiveCampaignLink('d-1', 'l-2', 'acme');

        self::assertSame(SiteCampaignLinkList::MAX_LINKS, $list->maxLinks);
        self::assertNull($list->links[0]->archivedAt);
        self::assertSame('', $list->links[1]->term);
        self::assertSame('2026-11-18T06:00:00Z', $archived->archivedAt);
        self::assertSame('hosting_plans', $link->term);
        self::assertContains('newsletter', $list->suggestedSources);
        self::assertSame([
            'GET ' . self::BASE . '?archived=true',
            'GET ' . self::BASE,
            'POST ' . self::BASE,
            'POST ' . self::BASE,
            'POST ' . self::BASE . '/l-2/archive?companySlug=acme',
        ], array_column($calls, 'route'));
        self::assertSame(self::fixtureArray('campaignLinkRequest'), $calls[2]['body']);
        self::assertSame(
            ['url' => 'https://example.com/', 'source' => 'google', 'medium' => 'cpc', 'campaign' => 'sale'],
            $calls[3]['body'],
        );
    }

    public function testCampaignLinkRefusalsCarryNamedCodes(): void
    {
        $this->assertRefusals(
            [
                'campaignLinkTakenProblem' => SiteCampaignLinkClient::CAMPAIGN_LINK_TAKEN_CODE,
                'campaignLinkLimitProblem' => SiteCampaignLinkClient::CAMPAIGN_LINK_LIMIT_CODE,
            ],
            static fn (SiteDomainClient $client): mixed => $client->campaignLinks()
                ->createCampaignLink('d-1', new SiteCampaignLinkRequest('https://example.com/', 'google', 'cpc', 'sale')),
        );
    }
}
