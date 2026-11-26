<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanStartPolicy names the values of CommandRequest.startPolicy, CorrectedCommand.startPolicy,
 * RunView.startPolicy.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanStartPolicy
{
    public const FULL_DURATION = 'full_duration';
    public const FIT_SCHEDULED_WINDOW = 'fit_scheduled_window';
}
