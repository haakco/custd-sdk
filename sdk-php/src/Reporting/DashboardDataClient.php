<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ApiHttp;
use HaakCo\Custd\Reporting\Data\CompletedRunExportRequest;
use HaakCo\Custd\Reporting\Data\DashboardCatalogueResponse;
use HaakCo\Custd\Reporting\Data\DashboardGenerationRequest;
use HaakCo\Custd\Reporting\Data\DashboardGenerationResponse;
use HaakCo\Custd\Reporting\Data\JobResponse;

/**
 * DashboardDataClient lists the reporting dashboards and builds their data generations and completed-run exports
 * on the Analytics API.
 */
final class DashboardDataClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List reporting dashboards.
     */
    public function listDashboards(): DashboardCatalogueResponse
    {
        return DashboardCatalogueResponse::fromPayload($this->http->object('GET', '/api/v1/reporting/dashboards', [], null));
    }

    /**
     * Create dashboard data generation.
     */
    public function createDashboardDataGeneration(DashboardGenerationRequest $request): DashboardGenerationResponse
    {
        return DashboardGenerationResponse::fromPayload($this->http->object('POST', '/api/v1/reporting/dashboard-data-generations', [], $request->serialise()));
    }

    /**
     * Create completed-run report export.
     */
    public function exportCompletedRun(CompletedRunExportRequest $request): JobResponse
    {
        return JobResponse::fromPayload($this->http->object('POST', '/api/v1/reporting/exports/completed-run', [], $request->serialise()));
    }
}
