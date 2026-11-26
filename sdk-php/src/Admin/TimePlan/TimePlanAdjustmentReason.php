<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanAdjustmentReason names the values of CalculationReceipt.reason, DefinitionMathAdjustmentResult.reason.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanAdjustmentReason
{
    public const LATE_START = 'late_start';
    public const EARLY_COMPLETION = 'early_completion';
    public const OVERRUN = 'overrun';
    public const SKIP = 'skip';
    public const COMPLETION = 'completion';
    public const BOUNDARY_CHANGE = 'boundary_change';
}
