<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerProductTermsVersion
{
    public function __construct(
        public string $partnerCompanyUuid,
        public string $effectiveFrom,
        public string $agreementDate,
        public string $agreementReference,
        public bool $signedAgreementAttested,
        public string $unitCost,
        public string $sellerCut,
        public string $termsUuid,
        public string $recordedByUserUuid,
        public string $currency,
        public int $holdDays,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'effectiveFrom'),
            Fields::string($payload, 'agreementDate'),
            Fields::string($payload, 'agreementReference'),
            Fields::boolean($payload, 'signedAgreementAttested'),
            Fields::string($payload, 'unitCost'),
            Fields::string($payload, 'sellerCut'),
            Fields::string($payload, 'termsUuid'),
            Fields::string($payload, 'recordedByUserUuid'),
            Fields::string($payload, 'currency'),
            Fields::integer($payload, 'holdDays'),
        );
    }
}
