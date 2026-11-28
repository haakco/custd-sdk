<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum UsageScheduleState: string
{
    case Scheduled = 'scheduled';
    case Cancelled = 'cancelled';
    case InvoiceIssued = 'invoice_issued';
    case NoAmountDue = 'no_amount_due';
    case ReviewRequired = 'review_required';
}
