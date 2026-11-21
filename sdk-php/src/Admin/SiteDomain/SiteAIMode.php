<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteAIMode: string
{
    case Off = 'off';
    case Platform = 'platform';
    case OwnKey = 'own-key';
}
