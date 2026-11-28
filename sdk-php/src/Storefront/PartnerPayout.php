<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerPayout
{
    public function __construct(
        public string $externalReference,
        public Money $amount,
        public string $paidAt,
        public string $payoutUuid,
        public string $partnerCompanyUuid,
        public string $paidOn,
        public string $recordedAt,
        public string $preferenceUuid,
        public string $taxDisclosureUuid,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'externalReference'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'paidAt'),
            Fields::string($payload, 'payoutUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'paidOn'),
            Fields::string($payload, 'recordedAt'),
            Fields::string($payload, 'preferenceUuid'),
            Fields::string($payload, 'taxDisclosureUuid'),
        );
    }
}
