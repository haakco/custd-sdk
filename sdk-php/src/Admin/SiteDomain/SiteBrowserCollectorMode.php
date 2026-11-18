<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteBrowserCollectorMode: string
{
    case Enabled = 'enabled';
    case Disabled = 'disabled';
}
