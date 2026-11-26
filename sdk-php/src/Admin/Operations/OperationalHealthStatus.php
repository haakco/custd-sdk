<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

/**
 * OperationalHealthStatus names the values of OperationalStageSummary.status, OperationalSummary.status,
 * SystemStageStatus.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class OperationalHealthStatus
{
    public const HEALTHY = 'healthy';
    public const DEGRADED = 'degraded';
    public const FAILING = 'failing';
    public const UNKNOWN = 'unknown';
}
