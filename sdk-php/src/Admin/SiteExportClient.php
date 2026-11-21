<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteInsightsExport;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchMetricPage;

/**
 * SiteExportClient reads everything Custd keeps about one domain, so a client can take its data
 * elsewhere. It is reached through SiteDomainClient::export(). A bad offset or limit is a plain 400
 * with no code. A system administrator names the tenant with the company slug.
 */
final class SiteExportClient
{
    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read the domain's export ({@see SiteInsightsExport::SCHEMA}) without its daily search metric rows. */
    public function getExport(string $domainUuid, ?string $companySlug = null): SiteInsightsExport
    {
        return SiteInsightsExport::fromPayload(
            $this->http->send('GET', SiteDomainHttp::item($domainUuid) . '/export', [], $companySlug)
        );
    }

    /**
     * Page through the domain's daily search metric rows. $limit is 1 to SiteSearchMetricPage::MAX_LIMIT;
     * null leaves offset and limit to the server.
     */
    public function listSearchMetrics(
        string $domainUuid,
        ?int $offset = null,
        ?int $limit = null,
        ?string $companySlug = null,
    ): SiteSearchMetricPage {
        return SiteSearchMetricPage::fromPayload($this->http->send(
            'GET',
            SiteDomainHttp::item($domainUuid) . '/export/search-metrics',
            SiteDomainHttp::query(['offset' => $offset, 'limit' => $limit]),
            $companySlug
        ));
    }
}
