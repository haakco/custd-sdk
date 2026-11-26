<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowTimingState names the values of EvaluationResponse.state, Expectation.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowTimingState
{
    public const READY = 'ready';
    public const COLD_START = 'cold_start';
    public const SPARSE = 'sparse';
    public const STALE = 'stale';
    public const PARTIAL = 'partial';
    public const UNAVAILABLE = 'unavailable';
    public const ERROR = 'error';
}
