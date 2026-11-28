<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum AccountingFeeKind: string
{
    case ProductFee = 'product_fee';
    case ReferralFee = 'referral_fee';
}
