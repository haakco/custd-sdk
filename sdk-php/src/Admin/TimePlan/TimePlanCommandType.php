<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanCommandType names the values of CommandRequest.type, CorrectedCommand.type.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanCommandType
{
    public const SCHEDULE_RUN = 'schedule_run';
    public const START_RUN = 'start_run';
    public const START_BLOCK = 'start_block';
    public const COMPLETE_BLOCK = 'complete_block';
    public const SKIP_BLOCK = 'skip_block';
    public const CHANGE_BOUNDARY = 'change_boundary';
    public const COMPLETE_RUN = 'complete_run';
    public const CANCEL_RUN = 'cancel_run';
    public const APPEND_CORRECTION = 'append_correction';
}
