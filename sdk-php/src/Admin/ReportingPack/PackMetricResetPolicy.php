<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackMetricResetPolicy names the values of PackMetric.resetPolicy.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackMetricResetPolicy
{
    public const AS_INCREMENT = 'as_increment';
    public const REJECT = 'reject';
    public const ROLLOVER = 'rollover';
}
