<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Settled = 'settled';
    case Failed = 'failed';
}
