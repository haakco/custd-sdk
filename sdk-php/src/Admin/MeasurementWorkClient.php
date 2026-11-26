<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Measurement\MeasurementCalibrationExerciseCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementCalibrationExerciseResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementDecisionModelCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementDecisionModelListResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementDecisionModelResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementDecisionModelUpdateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementImportRunResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementProject;
use HaakCo\Custd\Admin\Measurement\MeasurementSeriesCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementSeriesResponse;
use HaakCo\Custd\Admin\Measurement\MeasurementTargetCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementTargetResponse;
use HaakCo\Custd\Admin\Measurement\ProjectCompleteRequest;
use HaakCo\Custd\Admin\Measurement\ProjectEstimate;
use HaakCo\Custd\Admin\Measurement\ProjectEstimateCreateRequest;
use HaakCo\Custd\Admin\Measurement\ProjectEstimateListResponse;
use HaakCo\Custd\Admin\Measurement\ProjectRunCreateRequest;
use HaakCo\Custd\Admin\Measurement\ProjectUpdateRequest;

/**
 * MeasurementWorkClient changes a measurement project after it is created: its runs, series, targets, estimates,
 * imports, calibration exercises and decision models.
 */
final class MeasurementWorkClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Update a measurement project.
     */
    public function updateProject(string $projectUuid, ProjectUpdateRequest $request = new ProjectUpdateRequest(), ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('PATCH', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Cancel a measurement project.
     */
    public function cancelProject(string $projectUuid, ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/cancel', ['companySlug' => $companySlug], null));
    }

    /**
     * Complete a measurement project with its actual date.
     */
    public function completeProject(string $projectUuid, ProjectCompleteRequest $request, ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/complete', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Start a new run of a measurement project.
     */
    public function startRun(string $projectUuid, ProjectRunCreateRequest $request, ?string $companySlug = null): MeasurementProject
    {
        return MeasurementProject::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/runs', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Create measurement series.
     */
    public function createSeries(string $projectUuid, MeasurementSeriesCreateRequest $request, ?string $companySlug = null): MeasurementSeriesResponse
    {
        return MeasurementSeriesResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/series', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Create a measurement target.
     */
    public function createTarget(string $projectUuid, MeasurementTargetCreateRequest $request, ?string $companySlug = null): MeasurementTargetResponse
    {
        return MeasurementTargetResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/targets', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Reopen a met measurement target.
     */
    public function reopenTarget(string $projectUuid, string $targetUuid, ?string $companySlug = null): MeasurementTargetResponse
    {
        return MeasurementTargetResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/targets/' . rawurlencode($targetUuid) . '/reopen', ['companySlug' => $companySlug], null));
    }

    /**
     * List a measurement project's delivery estimates.
     */
    public function listEstimates(string $projectUuid, ?string $companySlug = null): ProjectEstimateListResponse
    {
        return ProjectEstimateListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/estimates', ['companySlug' => $companySlug], null));
    }

    /**
     * Record a delivery estimate.
     */
    public function createEstimate(string $projectUuid, ProjectEstimateCreateRequest $request, ?string $companySlug = null): ProjectEstimate
    {
        return ProjectEstimate::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/estimates', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Get a measurement import.
     */
    public function getImport(string $projectUuid, string $importUuid, ?string $companySlug = null): MeasurementImportRunResponse
    {
        return MeasurementImportRunResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/imports/' . rawurlencode($importUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Create a measurement calibration exercise.
     */
    public function createCalibrationExercise(string $projectUuid, MeasurementCalibrationExerciseCreateRequest $request, ?string $companySlug = null): MeasurementCalibrationExerciseResponse
    {
        return MeasurementCalibrationExerciseResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/calibration-exercises', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * List measurement decision models.
     */
    public function listDecisionModels(string $projectUuid, ?string $companySlug = null): MeasurementDecisionModelListResponse
    {
        return MeasurementDecisionModelListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/decisions', ['companySlug' => $companySlug], null));
    }

    /**
     * Get a measurement decision model.
     */
    public function getDecisionModel(string $projectUuid, string $decisionUuid, ?string $companySlug = null): MeasurementDecisionModelResponse
    {
        return MeasurementDecisionModelResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/decisions/' . rawurlencode($decisionUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Create a measurement decision model.
     */
    public function createDecisionModel(string $projectUuid, MeasurementDecisionModelCreateRequest $request, ?string $companySlug = null): MeasurementDecisionModelResponse
    {
        return MeasurementDecisionModelResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/decisions', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Update a measurement decision model.
     */
    public function updateDecisionModel(string $projectUuid, string $decisionUuid, MeasurementDecisionModelUpdateRequest $request = new MeasurementDecisionModelUpdateRequest(), ?string $companySlug = null): MeasurementDecisionModelResponse
    {
        return MeasurementDecisionModelResponse::fromPayload($this->http->object('PATCH', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/decisions/' . rawurlencode($decisionUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Archive a measurement decision model.
     */
    public function archiveDecisionModel(string $projectUuid, string $decisionUuid, ?string $companySlug = null): void
    {
        $this->http->none('DELETE', '/api/v1/admin/measurement/projects/' . rawurlencode($projectUuid) . '/decisions/' . rawurlencode($decisionUuid), ['companySlug' => $companySlug], null);
    }
}
