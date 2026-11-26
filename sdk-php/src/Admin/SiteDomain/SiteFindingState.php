<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteFindingState selects which findings a list returns. */
final class SiteFindingState
{
    public const OPEN = 'open';
    public const FIXED = 'fixed';
    public const ALL = 'all';
}
