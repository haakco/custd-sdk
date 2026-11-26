<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppMeetingBlockStatus names the values of AppMeetingBlock.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppMeetingBlockStatus
{
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
    public const COMPLETED = 'completed';
    public const SKIPPED = 'skipped';
    public const NOT_RUN = 'not_run';
}
