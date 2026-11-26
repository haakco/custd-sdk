<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * PresentationPresetId names the values of PresentationPresetSelection.presetId.
 * A value Custd adds later still decodes as a plain string.
 */
final class PresentationPresetId
{
    public const FORECAST_CONVERGENCE_V1 = 'forecast_convergence_v1';
    public const ANOMALY_REFERENCE_V1 = 'anomaly_reference_v1';
    public const DESCRIPTIVE_DRIVER_V1 = 'descriptive_driver_v1';
    public const UNCERTAINTY_REFERENCE_V1 = 'uncertainty_reference_v1';
}
