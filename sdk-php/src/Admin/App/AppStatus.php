<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

/**
 * AppStatus names the values of AppSummary.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppStatus
{
    public const NEEDS_ATTENTION = 'needs_attention';
    public const REMOVAL_UNFINISHED = 'removal_unfinished';
    public const LIVE = 'live';
    public const NOT_DEPLOYED = 'not_deployed';
    public const PAUSED = 'paused';
    public const OFFBOARDED = 'offboarded';
}
