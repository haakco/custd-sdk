<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteFindingState selects which findings a list returns. */
enum SiteFindingState: string
{
    case Open = 'open';
    case Fixed = 'fixed';
    case All = 'all';
}
