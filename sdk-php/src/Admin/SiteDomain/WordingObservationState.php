<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum WordingObservationState: string
{
    case Unread = 'unread';
    case Unavailable = 'unavailable';
    case Short = 'short';
    case Ready = 'ready';
}
