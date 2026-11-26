<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteStatusComponentStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPageDraft;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusPageSelection;
use HaakCo\Custd\Admin\SiteDomain\SiteStatusUpdateRequest;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-status-page.json through a Site's status page lifecycle. */
final class SiteStatusPageClientTest extends TestCase
{
    use SiteFixtureReplay;

    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1/status-page';

    private static function fixtureFile(): string
    {
        return 'site-status-page.json';
    }

    public function testStatusPageLifecycleSendsItsRoutes(): void
    {
        $draft = SiteStatusPageDraft::fromPayload(self::fixtureValue('statusPageDraft'));
        $update = self::fixtureValue('statusPageUpdateRequest');

        $empty = $this->replay($calls, 'statusPageSettingsEmpty')->statusPage()->getSettings('d-1');
        $preview = $this->replay($calls, 'statusPagePreview')->statusPage()->preview('d-1', $draft);
        $publication = $this->replay($calls, 'statusPagePublication')->statusPage()->publish('d-1', $draft, 'acme');
        $settings = $this->replay($calls, 'statusPageSettings')->statusPage()->getSettings('d-1');
        $history = $this->replay($calls, 'statusPageUpdateHistory')->statusPage()->postUpdate(
            'd-1',
            new SiteStatusUpdateRequest((string) $update->requestUuid, (string) $update->message),
        );
        $this->replay($calls, 'statusPageSettingsEmpty', 204)->statusPage()->unpublish('d-1');

        self::assertNull($empty->draft);
        self::assertNull($empty->publication);
        self::assertSame(SiteStatusComponentStatus::UP, $preview->components[0]->status);
        self::assertSame(SiteStatusComponentStatus::MAINTENANCE, $preview->components[1]->status);
        self::assertNull($preview->components[1]->lastCheckedAt);
        self::assertSame('Service restored.', $preview->updates[0]->message);
        self::assertSame(
            'https://custd.com/status-page#AZijsgAAcACAAAAAAAAAAQGYo7IAAHAAgAAAAAAAAAE',
            $publication->publicUrl('https://custd.com/'),
        );
        self::assertEquals(
            new SiteStatusPageSelection('0198a3b2-0000-7000-8000-000000000001', 'Customer portal'),
            $settings->draft?->components[0],
        );
        self::assertSame($publication->publicKey, $settings->publication?->publicKey);
        self::assertSame('2026-11-20T06:05:00Z', $history->updates[0]->publishedAt);
        self::assertSame([
            'GET ' . self::BASE,
            'POST ' . self::BASE . '/preview',
            'PUT ' . self::BASE . '?companySlug=acme',
            'GET ' . self::BASE,
            'POST ' . self::BASE . '/updates',
            'DELETE ' . self::BASE,
        ], array_column($calls, 'route'));
        self::assertSame(self::fixtureArray('statusPageDraft'), $calls[1]['body']);
        self::assertSame(self::fixtureArray('statusPageDraft'), $calls[2]['body']);
        self::assertSame(self::fixtureArray('statusPageUpdateRequest'), $calls[4]['body']);
    }
}
