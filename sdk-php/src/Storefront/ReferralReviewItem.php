<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReferralReviewItem
{
    public function __construct(
        public string $attributionUuid,
        public string $eventUuid,
        public string $buyerCompanyUuid,
        public string $partnerCompanyUuid,
        public string $invoiceUuid,
        public ReferralReviewEventType $eventType,
        public string $failureCode,
        public string $reviewedAt,
        public bool $retryEligible,
        public ?string $firstReceivedOn = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'attributionUuid'),
            Fields::string($payload, 'eventUuid'),
            Fields::string($payload, 'buyerCompanyUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'invoiceUuid'),
            ReferralReviewEventType::from(Fields::string($payload, 'eventType')),
            Fields::string($payload, 'failureCode'),
            Fields::string($payload, 'reviewedAt'),
            Fields::boolean($payload, 'retryEligible'),
            Fields::optionalString($payload, 'firstReceivedOn'),
        );
    }
}
