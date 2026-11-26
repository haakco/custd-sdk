<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Measurement\MeasurementObservationBulkRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationBulkResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationCSVImportRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementObservationRow;
use HaakCo\Custd\Admin\Measurement\MeasurementProject;
use HaakCo\Custd\Admin\Measurement\MeasurementProjectCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementProjectListResponse;

/**
 * MeasurementProjectClient creates, lists and reads a tenant's measurement projects and submits their
 * observations. An observation import must account for every submitted row: a response with fewer results, or a
 * success without an observation UUID, raises instead of returning a partial receipt. A system administrator names
 * the tenant with companySlug.
 */
final class MeasurementProjectClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Create a measurement project.
     */
    public function create(MeasurementProjectCreateRequest $request, ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * List measurement projects.
     */
    public function list(?string $companySlug = null): MeasurementProjectListResponse
    {
        return MeasurementProjectListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects', ['companySlug' => $companySlug], null));
    }

    /**
     * Get a measurement project.
     */
    public function get(string $projectUuid, ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Submit one observation.
     */
    public function submitObservation(string $projectUuid, MeasurementObservationRow $observation, ?string $companySlug = null): MeasurementObservationBulkResponse
    {
        return $this->submitObservations($projectUuid, new MeasurementObservationBulkRequest([$observation]), $companySlug);
    }

    /**
     * Submit observations in bulk; the response carries one result per submitted row.
     */
    public function submitObservations(string $projectUuid, MeasurementObservationBulkRequest $request, ?string $companySlug = null): MeasurementObservationBulkResponse
    {
        $response = MeasurementObservationBulkResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/observations:bulk', ['companySlug' => $companySlug], $request->serialise()));
        self::validateResults($response, count($request->rows));

        return $response;
    }

    /**
     * Import observations from CSV text; the response must carry one result for each of the expected rows.
     */
    public function importCSVString(string $projectUuid, string $csv, int $expectedRows, ?string $companySlug = null): MeasurementObservationBulkResponse
    {
        $response = MeasurementObservationBulkResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/observations:csv', ['companySlug' => $companySlug], (new MeasurementObservationCSVImportRequest($csv))->serialise()));
        self::validateResults($response, $expectedRows);

        return $response;
    }

    private static function validateResults(MeasurementObservationBulkResponse $response, int $submittedRows): void
    {
        $count = count($response->results);
        if ($count !== $submittedRows) {
            throw new \RuntimeException(
                "custd: measurement result count {$count} does not match submitted row count {$submittedRows}"
            );
        }
        foreach ($response->results as $index => $result) {
            if ($result->success && ($result->observationUuid ?? '') === '') {
                throw new \RuntimeException("custd: measurement result {$index} missing observationUuid");
            }
        }
    }
}
