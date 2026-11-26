<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteAIConsentRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIOwnerHandoff;
use HaakCo\Custd\Admin\SiteDomain\SiteAIOwnerHandoffRequest;
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

    /**
     * System administrators only. Omit the period to use the server's current-month default.
     *
     * @param SiteAIUsagePeriod::*|null $period
     */
    public function getPlatformUsage(?string $period = null): SiteAIPlatformUsage
    {
        $query = $period === null ? [] : ['period' => $period];

        return SiteAIPlatformUsage::fromPayload($this->http->send('GET', '/admin/site-insights/ai-usage', $query, null));
    }

    /**
     * Issue a one-time AI settings handoff for one owner of a data space this broker manages. The tenant is in
     * the request, so no acting company is sent. Redeem it with {@see \HaakCo\Custd\App\PublicReadClient::redeemSiteAIOwnerHandoff()}.
     */
    public function createOwnerHandoff(SiteAIOwnerHandoffRequest $request): SiteAIOwnerHandoff
    {
        return SiteAIOwnerHandoff::fromPayload(
            $this->http->send('POST', SiteDomainHttp::COLLECTION . '/ai-owner-handoffs', [], null, $request->serialise()),
        );
    }
}
