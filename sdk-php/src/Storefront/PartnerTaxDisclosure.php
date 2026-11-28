<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerTaxDisclosure
{
    public function __construct(
        public string $disclosureUuid,
        public PartnerTaxStatus $status,
        public string $jurisdiction,
        public string $effectiveFrom,
        public string $recordedAt,
        public ?string $registrationNumber = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'disclosureUuid'),
            PartnerTaxStatus::from(Fields::string($payload, 'status')),
            Fields::string($payload, 'jurisdiction'),
            Fields::string($payload, 'effectiveFrom'),
            Fields::string($payload, 'recordedAt'),
            Fields::optionalString($payload, 'registrationNumber'),
        );
    }
}
