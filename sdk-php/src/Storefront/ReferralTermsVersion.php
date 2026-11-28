<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReferralTermsVersion
{
    public function __construct(
        public string $termsUuid,
        public string $effectiveFrom,
        public string $agreementDate,
        public string $agreementReference,
        public string $recordedByUserUuid,
        public string $share,
        public int $months,
        public int $holdDays,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'termsUuid'),
            Fields::string($payload, 'effectiveFrom'),
            Fields::string($payload, 'agreementDate'),
            Fields::string($payload, 'agreementReference'),
            Fields::string($payload, 'recordedByUserUuid'),
            Fields::string($payload, 'share'),
            Fields::integer($payload, 'months'),
            Fields::integer($payload, 'holdDays'),
        );
    }
}
