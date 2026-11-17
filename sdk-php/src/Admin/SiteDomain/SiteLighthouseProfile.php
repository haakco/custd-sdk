<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteLighthouseProfile: string
{
    case Desktop = 'desktop';
    case Mobile = 'mobile';
}
