<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum AccountingGap: string
{
    case ProviderFeeEvidenceMissing = 'provider_fee_evidence_missing';
    case ProviderNetDepositEvidenceMissing = 'provider_net_deposit_evidence_missing';
    case ProviderSettlementBatchReferenceMissing = 'provider_settlement_batch_reference_missing';
}
