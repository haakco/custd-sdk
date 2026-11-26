<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowAttemptState names the values of AttemptProjection.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowAttemptState
{
    public const RUNNING = 'running';
    public const COMPLETED = 'completed';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';
    public const SKIPPED = 'skipped';
}
