<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

/**
 * PrivacyConsentPurpose names the values of PrivacyConsentRecord.purpose, PrivacyConsentRecordRequest.purpose.
 * A value Custd adds later still decodes as a plain string.
 */
final class PrivacyConsentPurpose
{
    public const ANALYTICS = 'analytics';
    public const PRODUCT_IMPROVEMENT = 'product_improvement';
    public const MARKETING = 'marketing';
}
