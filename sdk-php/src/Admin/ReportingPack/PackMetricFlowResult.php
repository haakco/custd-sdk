<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackMetricFlowResult names the values of PackMetric.flowResult.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackMetricFlowResult
{
    public const STEPS = 'steps';
    public const STARTS = 'starts';
    public const COMPLETIONS = 'completions';
    public const DROP_OFFS = 'drop_offs';
    public const COMPLETION_RATE = 'completion_rate';
    public const UNCORRELATED = 'uncorrelated';
}
