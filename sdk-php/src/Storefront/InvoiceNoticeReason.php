<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum InvoiceNoticeReason: string
{
    case InvalidDocument = 'invalid_document';
    case PayloadMismatch = 'payload_mismatch';
}
