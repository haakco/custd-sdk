<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerMovement
{
    public function __construct(
        public string $movementUuid,
        public string $kind,
        public string $termsUuid,
        public string $buyerCompanyUuid,
        public string $invoiceUuid,
        public string $paymentUuid,
        public int $lineNumber,
        public string $postedOn,
        public string $availableOn,
        public Money $partnerDelta,
        public Money $sellerCutDelta,
        public ?string $originalMovementUuid = null,
        public ?PartnerEarning $earning = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $earning = Fields::optionalObject($payload, 'earning');

        return new self(
            Fields::string($payload, 'movementUuid'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'termsUuid'),
            Fields::string($payload, 'buyerCompanyUuid'),
            Fields::string($payload, 'invoiceUuid'),
            Fields::string($payload, 'paymentUuid'),
            Fields::integer($payload, 'lineNumber'),
            Fields::string($payload, 'postedOn'),
            Fields::string($payload, 'availableOn'),
            Money::fromPayload(Fields::object($payload, 'partnerDelta')),
            Money::fromPayload(Fields::object($payload, 'sellerCutDelta')),
            Fields::optionalString($payload, 'originalMovementUuid'),
            $earning === null ? null : PartnerEarning::fromPayload($earning),
        );
    }
}
