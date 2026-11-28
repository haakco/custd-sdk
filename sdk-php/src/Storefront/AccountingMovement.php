<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingMovement
{
    public function __construct(
        public AccountingFeeKind $feeKind,
        public string $partnerCompanyUuid,
        public string $paymentUuid,
        public string $termsUuid,
        public int $lineNumber,
        public string $availableOn,
        public Money $partnerDelta,
        public Money $sellerCutDelta,
        public ?string $originalMovementUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AccountingFeeKind::from(Fields::string($payload, 'feeKind')),
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'paymentUuid'),
            Fields::string($payload, 'termsUuid'),
            Fields::integer($payload, 'lineNumber'),
            Fields::string($payload, 'availableOn'),
            Money::fromPayload(Fields::object($payload, 'partnerDelta')),
            Money::fromPayload(Fields::object($payload, 'sellerCutDelta')),
            Fields::optionalString($payload, 'originalMovementUuid'),
        );
    }
}
