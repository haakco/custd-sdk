<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum AccountingRecordKind: string
{
    case Invoice = 'invoice';
    case CreditNote = 'credit_note';
    case PaymentAllocation = 'payment_allocation';
    case Refund = 'refund';
    case PartnerMovement = 'partner_movement';
    case PartnerPayout = 'partner_payout';
    case PartnerSetoff = 'partner_setoff';
    case PartnerSetoffReversal = 'partner_setoff_reversal';
    case PartnerProductProjectionGap = 'partner_product_projection_gap';
    case PartnerReferralProjectionGap = 'partner_referral_projection_gap';
}
