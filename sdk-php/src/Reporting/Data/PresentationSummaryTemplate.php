<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * PresentationSummaryTemplate names the values of PresentationPresetSelection.summaryTemplateId.
 * A value Custd adds later still decodes as a plain string.
 */
final class PresentationSummaryTemplate
{
    public const FORECAST_WINDOW_EVIDENCE = 'forecast_window_evidence';
    public const ANOMALY_REFERENCE_EVIDENCE = 'anomaly_reference_evidence';
    public const DESCRIPTIVE_DRIVER_EVIDENCE = 'descriptive_driver_evidence';
    public const UNCERTAINTY_REFERENCE_EVIDENCE = 'uncertainty_reference_evidence';
}
