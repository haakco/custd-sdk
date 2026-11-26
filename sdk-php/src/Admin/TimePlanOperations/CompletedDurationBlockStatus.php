<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

/**
 * CompletedDurationBlockStatus names the values of CompletedDurationReportBlockInput.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class CompletedDurationBlockStatus
{
    public const COMPLETED = 'completed';
    public const SKIPPED = 'skipped';
    public const NOT_RUN = 'not_run';
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
}
