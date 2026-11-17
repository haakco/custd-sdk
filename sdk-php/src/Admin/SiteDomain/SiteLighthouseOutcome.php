<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteLighthouseOutcome: string
{
    case Success = 'success';
    case Failed = 'failed';
}
