<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum InvoiceStatus: string
{
    case Open = 'open';
    case Paid = 'paid';
}
