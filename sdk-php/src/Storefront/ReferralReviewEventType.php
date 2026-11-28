<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum ReferralReviewEventType: string
{
    case BillingPaymentSettled = 'billing.payment.settled';
    case BillingPaymentRefunded = 'billing.payment.refunded';
}
