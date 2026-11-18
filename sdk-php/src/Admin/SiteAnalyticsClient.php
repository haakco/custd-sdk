<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteAnalyticsConnection;
use HaakCo\Custd\Admin\SiteDomain\SiteAnalyticsReport;

/**
 * SiteAnalyticsClient connects a domain to its GA4 property and reads the imported numbers. It is
 * reached through SiteDomainClient::analytics(). A system administrator names the tenant with the
 * company slug.
 */
final class SiteAnalyticsClient
{
    /** The problem code of the 400 returned unless propertyId is a GA4 property's numeric ID. */
    public const ANALYTICS_PROPERTY_INVALID_CODE = 'site_analytics_property_invalid';

    /** The problem code of the 404 returned when disconnecting a domain that is not connected to GA4. */
    public const ANALYTICS_CONNECTION_NOT_FOUND_CODE = 'site_analytics_connection_not_found';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read the domain's GA4 landing pages, key events and channels. */
    public function getAnalytics(string $domainUuid, ?string $companySlug = null): SiteAnalyticsReport
    {
        return SiteAnalyticsReport::fromPayload(
            $this->http->send('GET', SiteDomainHttp::item($domainUuid) . '/analytics', [], $companySlug)
        );
    }

    /**
     * Connect the domain to a GA4 property, or replace it. $propertyId is the numeric ID GA4's
     * Property details show, such as 123456789 or properties/123456789.
     */
    public function connectGA4(string $domainUuid, string $propertyId, ?string $companySlug = null): SiteAnalyticsConnection
    {
        return SiteAnalyticsConnection::fromPayload(
            $this->http->send('PUT', self::ga4($domainUuid), [], $companySlug, ['propertyId' => $propertyId])
        );
    }

    /** Remove the domain's GA4 connection; {@see self::ANALYTICS_CONNECTION_NOT_FOUND_CODE} when there is none. */
    public function disconnectGA4(string $domainUuid, ?string $companySlug = null): void
    {
        $this->http->sendNoContent('DELETE', self::ga4($domainUuid), [], $companySlug);
    }

    private static function ga4(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/analytics/ga4';
    }
}
