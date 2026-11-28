<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

enum ReferralRetryStatus: string
{
    case Blocked = 'blocked';
    case Requeued = 'requeued';
    case NoReviewToRetry = 'no_review_to_retry';
}
