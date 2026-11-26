<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanThresholdCueSeverity names the values of ThresholdCue.severity.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanThresholdCueSeverity
{
    public const INFO = 'info';
    public const WARNING = 'warning';
    public const CRITICAL = 'critical';
}
