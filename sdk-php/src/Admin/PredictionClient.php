<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Prediction\DurationEvaluationRequest;
use HaakCo\Custd\Admin\Prediction\DurationEvaluationResponse;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionActivateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinition;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinitionCreateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinitionListResponse;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionDefinitionUpdateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionEvaluationSummary;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionOutcomeListResponse;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionPauseRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionRunListResponse;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionRunNowRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionThresholdEventListResponse;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionVersion;
use HaakCo\Custd\Admin\Prediction\MeasurementPredictionVersionPublishRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementSignalSource;
use HaakCo\Custd\Admin\Prediction\MeasurementSignalSourceCreateRequest;
use HaakCo\Custd\Admin\Prediction\MeasurementSignalSourceListResponse;

/**
 * PredictionClient owns the tenant-scoped configurable signal prediction lifecycle: definitions and their
 * immutable versions, runs, outcomes, evaluations, threshold events and signal sources. The company slug is sent
 * explicitly on every request. List responses are envelopes; follow nextPageToken while it is set.
 */
final class PredictionClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List tenant-scoped prediction definitions.
     */
    public function listDefinitions(string $companySlug, ?int $pageSize = null, ?string $pageToken = null): MeasurementPredictionDefinitionListResponse
    {
        return MeasurementPredictionDefinitionListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions', ['pageSize' => $pageSize, 'pageToken' => $pageToken, 'companySlug' => $companySlug], null));
    }

    /**
     * Get a tenant-scoped prediction definition.
     */
    public function getDefinition(string $companySlug, string $definitionUuid): MeasurementPredictionDefinition
    {
        return MeasurementPredictionDefinition::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Create a tenant-scoped prediction definition (draft).
     */
    public function createDefinition(string $companySlug, MeasurementPredictionDefinitionCreateRequest $request): MeasurementPredictionDefinition
    {
        return MeasurementPredictionDefinition::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/predictions/definitions', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Update a tenant-scoped prediction definition draft.
     */
    public function updateDefinition(string $companySlug, string $definitionUuid, MeasurementPredictionDefinitionUpdateRequest $request): MeasurementPredictionDefinition
    {
        return MeasurementPredictionDefinition::fromPayload($this->http->object('PATCH', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Get an immutable prediction definition version.
     */
    public function getVersion(string $companySlug, string $definitionUuid, string $versionUuid): MeasurementPredictionVersion
    {
        return MeasurementPredictionVersion::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/versions/' . rawurlencode($versionUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Compile and publish a candidate version (immutable).
     */
    public function publishVersion(string $companySlug, string $definitionUuid, MeasurementPredictionVersionPublishRequest $request): MeasurementPredictionVersion
    {
        return MeasurementPredictionVersion::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/publish', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Activate an immutable version (writes partial-unique-index active row).
     */
    public function activateVersion(string $companySlug, string $definitionUuid, MeasurementPredictionActivateRequest $request): MeasurementPredictionVersion
    {
        return MeasurementPredictionVersion::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/activate', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Pause tenant-scoped prediction runs.
     */
    public function pauseDefinition(string $companySlug, string $definitionUuid, MeasurementPredictionPauseRequest $request = new MeasurementPredictionPauseRequest()): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/pause', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Resume tenant-scoped prediction runs.
     */
    public function resumeDefinition(string $companySlug, string $definitionUuid, MeasurementPredictionPauseRequest $request = new MeasurementPredictionPauseRequest()): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/resume', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Archive a tenant-scoped prediction definition while retaining its history.
     */
    public function archiveDefinition(string $companySlug, string $definitionUuid, MeasurementPredictionPauseRequest $request = new MeasurementPredictionPauseRequest()): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/archive', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Enqueue a forced evaluation through the scheduler.
     */
    public function runNow(string $companySlug, string $definitionUuid, MeasurementPredictionRunNowRequest $request = new MeasurementPredictionRunNowRequest()): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/run-now', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * List bounded prediction run history.
     */
    public function listRuns(string $companySlug, string $definitionUuid, ?int $pageSize = null): MeasurementPredictionRunListResponse
    {
        return MeasurementPredictionRunListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/runs', ['pageSize' => $pageSize, 'companySlug' => $companySlug], null));
    }

    /**
     * List bounded prediction outcome history.
     */
    public function listOutcomes(string $companySlug, string $definitionUuid, ?int $pageSize = null): MeasurementPredictionOutcomeListResponse
    {
        return MeasurementPredictionOutcomeListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/outcomes', ['pageSize' => $pageSize, 'companySlug' => $companySlug], null));
    }

    /**
     * Get the latest bounded evaluation summary.
     */
    public function getEvaluation(string $companySlug, string $definitionUuid): MeasurementPredictionEvaluationSummary
    {
        return MeasurementPredictionEvaluationSummary::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/evaluations', ['companySlug' => $companySlug], null));
    }

    /**
     * List durable prediction threshold events.
     */
    public function listThresholdEvents(string $companySlug, string $definitionUuid, ?int $pageSize = null): MeasurementPredictionThresholdEventListResponse
    {
        return MeasurementPredictionThresholdEventListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/threshold-events', ['pageSize' => $pageSize, 'companySlug' => $companySlug], null));
    }

    /**
     * List tenant-scoped signal sources.
     */
    public function listSignalSources(string $companySlug, ?int $pageSize = null, ?string $pageToken = null): MeasurementSignalSourceListResponse
    {
        return MeasurementSignalSourceListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/sources', ['pageSize' => $pageSize, 'pageToken' => $pageToken, 'companySlug' => $companySlug], null));
    }

    /**
     * Get a tenant-scoped signal source.
     */
    public function getSignalSource(string $companySlug, string $sourceUuid): MeasurementSignalSource
    {
        return MeasurementSignalSource::fromPayload($this->http->object('GET', '/api/v1/admin/measurement/predictions/sources/' . rawurlencode($sourceUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Create a tenant-scoped signal source.
     */
    public function createSignalSource(string $companySlug, MeasurementSignalSourceCreateRequest $request): MeasurementSignalSource
    {
        return MeasurementSignalSource::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/predictions/sources', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Activate a tenant-scoped signal source.
     */
    public function activateSignalSource(string $companySlug, string $sourceUuid): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/sources/' . rawurlencode($sourceUuid) . '/activate', ['companySlug' => $companySlug], null);
    }

    /**
     * Archive a tenant-scoped signal source while retaining its history.
     */
    public function archiveSignalSource(string $companySlug, string $sourceUuid): void
    {
        $this->http->none('POST', '/api/v1/admin/measurement/predictions/sources/' . rawurlencode($sourceUuid) . '/archive', ['companySlug' => $companySlug], null);
    }

    /**
     * Evaluate one duration history with the server's chronological rolling-origin fold. The caller reads
     * prediction error and interval containment from named fields, and the version evidence says which immutable
     * version produced them.
     */
    public function evaluateDurationHistory(string $companySlug, string $definitionUuid, DurationEvaluationRequest $body): DurationEvaluationResponse
    {
        return DurationEvaluationResponse::fromPayload($this->http->object('POST', '/api/v1/admin/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/duration-evaluations', ['companySlug' => $companySlug], $body->toPayload()));
    }
}
