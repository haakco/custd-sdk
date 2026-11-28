<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum PartnerSettlementMode: string
{
    case Payout = 'payout';
    case SetOff = 'set_off';
}
