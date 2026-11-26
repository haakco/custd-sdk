<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppMeetingStatus names the values of AppMeeting.status.
 * ready until started; completed once ended.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppMeetingStatus
{
    public const READY = 'ready';
    public const RUNNING = 'running';
    public const COMPLETED = 'completed';
    public const CANCELLED = 'cancelled';
}
