<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteAIProduct: string
{
    case Hosting = 'hosting';
    case Custd = 'custd';
    case CB = 'cb';
    case Awthy = 'awthy';
}
