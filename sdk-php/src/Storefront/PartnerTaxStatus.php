<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum PartnerTaxStatus: string
{
    case Registered = 'registered';
    case NotRegistered = 'not_registered';
}
