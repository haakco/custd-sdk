<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum InvoiceNoticeStatus: string
{
    case Pending = 'pending';
    case Queued = 'queued';
    case Sent = 'sent';
    case Failed = 'failed';
    case Unknown = 'unknown';
    case SellerUnavailable = 'seller_unavailable';
    case ReviewRequired = 'review_required';
}
