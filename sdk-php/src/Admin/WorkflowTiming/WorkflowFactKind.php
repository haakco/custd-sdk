<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowFactKind names the values of FactPayload.kind: which run or step fact an Observation reports.
 * A value Custd adds later still decodes as a plain string.
 */
final class WorkflowFactKind
{
    public const RUN_STARTED = 'run_started';
    public const RUN_FINISHED = 'run_finished';
    public const STEP_STARTED = 'step_started';
    public const STEP_FINISHED = 'step_finished';
}
