<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

/**
 * CompletedDurationBlockOutcome names the values of CompletedDurationReportBlockInput.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class CompletedDurationBlockOutcome
{
    public const COMPLETED = 'completed';
    public const SKIPPED = 'skipped';
    public const CANCELLED = 'cancelled';
    public const NOT_RUN = 'not_run';
    public const CENSORED = 'censored';
}
