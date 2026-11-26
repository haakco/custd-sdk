<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppAlertRuleType names the values of AppItemAlertRule.type, AppItemAlertRuleCreateRequest.type.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppAlertRuleType
{
    public const DEADLINE_PROBABILITY_BELOW = 'deadline_probability_below';
    public const TARGET_REACHED = 'target_reached';
    public const ESTIMATE_STALE = 'estimate_stale';
    public const FORECAST_MOVED_INSIDE_TARGET = 'forecast_moved_inside_target';
    public const MODEL_RANGE_ABOVE = 'model_range_above';
}
