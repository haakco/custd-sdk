<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

/**
 * CompletedDurationRunStatus names the values of CompletedDurationReportSummary.run_status.
 * A value Custd adds later still decodes as a plain string.
 */
final class CompletedDurationRunStatus
{
    public const COMPLETED = 'completed';
    public const CANCELLED = 'cancelled';
}
