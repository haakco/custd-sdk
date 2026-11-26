<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowExcludedStepOutcome names the values of ExcludedStepOutcome.outcome.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowExcludedStepOutcome
{
    public const COMPLETED = 'completed';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';
    public const SKIPPED = 'skipped';
    public const OPEN = 'open';
}
