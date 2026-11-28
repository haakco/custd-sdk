<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum UsageIssuanceStatus: string
{
    case InvoiceIssued = 'invoice_issued';
    case NoAmountDue = 'no_amount_due';
}
