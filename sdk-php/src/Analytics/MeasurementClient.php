<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Admin\ApiHttp;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastRunRequest;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastRunResponse;
use HaakCo\Custd\Analytics\Measurement\MeasurementForecastStoryResponse;
use HaakCo\Custd\Analytics\Measurement\MeasurementOverviewResponse;
use HaakCo\Custd\Analytics\Measurement\MeasurementPredictionDefinitionList;
use HaakCo\Custd\Analytics\Measurement\MeasurementPredictionDefinitionRow;
use HaakCo\Custd\Analytics\Measurement\MeasurementPredictionEvaluationRow;
use HaakCo\Custd\Analytics\Measurement\MeasurementPredictionOutcomeList;
use HaakCo\Custd\Analytics\Measurement\MeasurementPredictionRunList;
use HaakCo\Custd\Analytics\Measurement\MeasurementSimulationRunRequest;
use HaakCo\Custd\Analytics\Measurement\MeasurementSimulationRunResponse;

/**
 * MeasurementClient reads measurement analysis on the Analytics API: the overview, prediction definitions and
 * their results, project forecasts and decision simulations.
 */
final class MeasurementClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get measurement overview.
     */
    public function overview(): MeasurementOverviewResponse
    {
        return MeasurementOverviewResponse::fromPayload($this->http->object('GET', '/api/v1/measurement/overview', [], null));
    }

    /**
     * List prediction definitions.
     */
    public function listPredictionDefinitions(): MeasurementPredictionDefinitionList
    {
        return MeasurementPredictionDefinitionList::fromPayload($this->http->object('GET', '/api/v1/measurement/predictions/definitions', [], null));
    }

    /**
     * Get a prediction definition.
     */
    public function getPredictionDefinition(string $definitionUuid): MeasurementPredictionDefinitionRow
    {
        return MeasurementPredictionDefinitionRow::fromPayload($this->http->object('GET', '/api/v1/measurement/predictions/definitions/' . rawurlencode($definitionUuid), [], null));
    }

    /**
     * Get a prediction definition's latest evaluation.
     */
    public function getPredictionEvaluation(string $definitionUuid): MeasurementPredictionEvaluationRow
    {
        return MeasurementPredictionEvaluationRow::fromPayload($this->http->object('GET', '/api/v1/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/evaluations', [], null));
    }

    /**
     * List a prediction definition's outcomes.
     */
    public function listPredictionOutcomes(string $definitionUuid): MeasurementPredictionOutcomeList
    {
        return MeasurementPredictionOutcomeList::fromPayload($this->http->object('GET', '/api/v1/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/outcomes', [], null));
    }

    /**
     * List a prediction definition's runs.
     */
    public function listPredictionRuns(string $definitionUuid, ?string $since = null): MeasurementPredictionRunList
    {
        return MeasurementPredictionRunList::fromPayload($this->http->object('GET', '/api/v1/measurement/predictions/definitions/' . rawurlencode($definitionUuid) . '/runs', ['since' => $since], null));
    }

    /**
     * Run a measurement forecast.
     */
    public function runForecast(string $projectUuid, MeasurementForecastRunRequest $request = new MeasurementForecastRunRequest()): MeasurementForecastRunResponse
    {
        return MeasurementForecastRunResponse::fromPayload($this->http->object('POST', '/api/v1/measurement/projects/' . rawurlencode($projectUuid) . '/forecast-runs', [], $request->serialise()));
    }

    /**
     * Get a measurement forecast run.
     */
    public function getForecastRun(string $projectUuid, string $runUuid): MeasurementForecastRunResponse
    {
        return MeasurementForecastRunResponse::fromPayload($this->http->object('GET', '/api/v1/measurement/projects/' . rawurlencode($projectUuid) . '/forecast-runs/' . rawurlencode($runUuid), [], null));
    }

    /**
     * Get recorded forecast story.
     */
    public function getForecastStory(string $projectUuid): MeasurementForecastStoryResponse
    {
        return MeasurementForecastStoryResponse::fromPayload($this->http->object('GET', '/api/v1/measurement/projects/' . rawurlencode($projectUuid) . '/forecast-story', [], null));
    }

    /**
     * Run a decision simulation.
     */
    public function runSimulation(string $projectUuid, string $decisionUuid, MeasurementSimulationRunRequest $request = new MeasurementSimulationRunRequest()): MeasurementSimulationRunResponse
    {
        return MeasurementSimulationRunResponse::fromPayload($this->http->object('POST', '/api/v1/measurement/projects/' . rawurlencode($projectUuid) . '/decisions/' . rawurlencode($decisionUuid) . '/simulation-runs', [], $request->serialise()));
    }

    /**
     * Get a decision simulation run.
     */
    public function getSimulationRun(string $projectUuid, string $decisionUuid, string $runUuid): MeasurementSimulationRunResponse
    {
        return MeasurementSimulationRunResponse::fromPayload($this->http->object('GET', '/api/v1/measurement/projects/' . rawurlencode($projectUuid) . '/decisions/' . rawurlencode($decisionUuid) . '/simulation-runs/' . rawurlencode($runUuid), [], null));
    }
}
