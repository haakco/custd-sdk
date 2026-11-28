<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum CheckoutState: string
{
    case Creating = 'creating';
    case Ready = 'ready';
    case ReviewRequired = 'review_required';
}
