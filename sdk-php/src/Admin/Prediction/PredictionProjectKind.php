<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

/**
 * PredictionProjectKind names the values of MeasurementPredictionDefinition.project_kind,
 * MeasurementPredictionDefinitionCreateRequest.project_kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class PredictionProjectKind
{
    public const DEADLINE_FORECAST = 'deadline_forecast';
    public const RUNWAY_FORECAST = 'runway_forecast';
    public const DECISION_ANALYSIS = 'decision_analysis';
    public const CALIBRATION = 'calibration';
    public const DURATION = 'duration';
    public const EVENT_PROBABILITY = 'event_probability';
}
