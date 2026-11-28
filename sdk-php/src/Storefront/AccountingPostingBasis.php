<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum AccountingPostingBasis: string
{
    case ProviderReceivedAt = 'provider_received_at';
    case RecordedReceivedDate = 'recorded_received_date';
    case VerificationDate = 'verification_date';
}
