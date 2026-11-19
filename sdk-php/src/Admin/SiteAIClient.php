<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteAIConsentRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIPlatformUsage;
use HaakCo\Custd\Admin\SiteDomain\SiteAISettings;
use HaakCo\Custd\Admin\SiteDomain\SiteAISettingsRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAITenantUsage;
use HaakCo\Custd\Admin\SiteDomain\SiteAIUsagePeriod;

/** Site Insights AI policy, consent and metered usage. */
final class SiteAIClient
{
    private const SETTINGS = SiteDomainHttp::COLLECTION . '/ai-settings';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    public function getSettings(): SiteAISettings
    {
        return SiteAISettings::fromPayload($this->http->send('GET', self::SETTINGS, [], null));
    }

    public function setSettings(SiteAISettingsRequest $request): SiteAISettings
    {
        return SiteAISettings::fromPayload($this->http->send('PUT', self::SETTINGS, [], null, $request->serialise()));
    }

    public function setConsent(SiteAIConsentRequest $request): SiteAISettings
    {
        return SiteAISettings::fromPayload($this->http->send('PUT', self::SETTINGS . '/consent', [], null, $request->serialise()));
    }

    /** Read the tenant's current UTC month. */
    public function getTenantUsage(): SiteAITenantUsage
    {
        return SiteAITenantUsage::fromPayload($this->http->send('GET', SiteDomainHttp::COLLECTION . '/ai-usage', [], null));
    }

    /** System administrators only. Omit the period to use the server's current-month default. */
    public function getPlatformUsage(?SiteAIUsagePeriod $period = null): SiteAIPlatformUsage
    {
        $query = $period === null ? [] : ['period' => $period->value];

        return SiteAIPlatformUsage::fromPayload($this->http->send('GET', '/admin/site-insights/ai-usage', $query, null));
    }
}
