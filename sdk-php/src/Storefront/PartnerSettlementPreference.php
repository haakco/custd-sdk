<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerSettlementPreference
{
    public function __construct(
        public string $preferenceUuid,
        public PartnerSettlementMode $mode,
        public string $effectiveFrom,
        public string $recordedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'preferenceUuid'),
            PartnerSettlementMode::from(Fields::string($payload, 'mode')),
            Fields::string($payload, 'effectiveFrom'),
            Fields::string($payload, 'recordedAt'),
        );
    }
}
