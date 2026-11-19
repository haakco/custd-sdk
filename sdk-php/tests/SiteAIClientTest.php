<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\SiteAIConsentRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIMode;
use HaakCo\Custd\Admin\SiteDomain\SiteAIProduct;
use HaakCo\Custd\Admin\SiteDomain\SiteAISettingsRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIUsagePeriod;
use PHPUnit\Framework\TestCase;

final class SiteAIClientTest extends TestCase
{
    use SiteFixtureReplay;

    private static function fixtureFile(): string
    {
        return 'site-ai.json';
    }

    public function testSettingsAndExplicitConsentUseTheTenantRoutes(): void
    {
        $ai = $this->replay($calls, 'settings')->ai();
        $settings = $ai->getSettings();
        self::assertSame(SiteAIMode::OwnKey, $settings->aiMode);
        self::assertTrue($settings->keyRefused);
        self::assertTrue($settings->ownKeyAvailable);
        self::assertSame('terms-v1', $settings->acceptedTermsVersion);
        self::assertStringNotContainsString('apiKey', json_encode($settings, JSON_THROW_ON_ERROR));

        $ai->setSettings(new SiteAISettingsRequest(SiteAIMode::OwnKey, 10_000_000, 'test-only-key'));
        $ai->setSettings(new SiteAISettingsRequest(SiteAIMode::OwnKey, 10_000_000));
        $ai->setConsent(SiteAIConsentRequest::grant('terms-v1'));
        self::assertSame([
            'GET http://localhost:8080/api/v1/site-domains/ai-settings',
            'PUT http://localhost:8080/api/v1/site-domains/ai-settings',
            'PUT http://localhost:8080/api/v1/site-domains/ai-settings',
            'PUT http://localhost:8080/api/v1/site-domains/ai-settings/consent',
        ], array_column($calls, 'route'));
        self::assertSame([
            null,
            ['aiMode' => 'own-key', 'monthlyCapUsdMicros' => 10_000_000, 'apiKey' => 'test-only-key'],
            ['aiMode' => 'own-key', 'monthlyCapUsdMicros' => 10_000_000],
            ['action' => 'grant', 'termsVersion' => 'terms-v1'],
        ], array_column($calls, 'body'));

        $revoked = $this->replay($revocation, 'revoked')->ai()->setConsent(SiteAIConsentRequest::revoke());
        self::assertFalse($revoked->keyRefused);
        self::assertFalse($revoked->keyConfigured);
        self::assertFalse($revoked->ownKeyAvailable);
        self::assertSame([['action' => 'revoke']], array_column($revocation, 'body'));
    }

    public function testUsageKeepsSeparateCostsAndOptionalProductAttribution(): void
    {
        $tenant = $this->replay($tenantCalls, 'tenantUsage')->ai()->getTenantUsage();
        self::assertSame(61, $tenant->monthlyCapUsedUsdMicros);
        self::assertSame(SiteAIUsagePeriod::Month, $tenant->usage->period);
        self::assertNull($tenant->usage->rows[0]->samplingProduct);
        self::assertSame(['GET http://localhost:8080/api/v1/site-domains/ai-usage'], array_column($tenantCalls, 'route'));

        $ai = $this->replay($calls, 'platformUsage')->ai();
        $platform = $ai->getPlatformUsage(SiteAIUsagePeriod::PreviousMonth);
        $ai->getPlatformUsage();
        $row = $platform->usage->rows[0];
        self::assertSame(SiteAIUsagePeriod::PreviousMonth, $platform->usage->period);
        self::assertSame(10_000_000, $platform->samplingMonthlyCapUsdMicros);
        self::assertSame(SiteAIProduct::Hosting, $row->samplingProduct);
        self::assertSame([13, 27, 61], [$row->confirmedCostUsdMicros, $row->estimatedCostUsdMicros, $row->capAccountedUsdMicros]);
        self::assertSame([
            'GET http://localhost:8080/api/v1/admin/site-insights/ai-usage?period=previous-month',
            'GET http://localhost:8080/api/v1/admin/site-insights/ai-usage',
        ], array_column($calls, 'route'));
    }
}
