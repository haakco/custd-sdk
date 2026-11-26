<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowRunState names the values of RunPrediction.state, RunProjection.state, RunReadResponse.state,
 * RunSummary.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowRunState
{
    public const RUNNING = 'running';
    public const COMPLETED = 'completed';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';
}
