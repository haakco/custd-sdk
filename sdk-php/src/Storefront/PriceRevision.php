<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PriceRevision
{
    public function __construct(
        public string $priceRevisionUuid,
        public int $revision,
        public UnitPrice $unitPrice,
        public string $taxTreatment,
        public string $taxRate,
        public string $taxLabel,
        public string $effectiveFrom,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'priceRevisionUuid'),
            Fields::integer($payload, 'revision'),
            UnitPrice::fromPayload(Fields::object($payload, 'unitPrice')),
            Fields::string($payload, 'taxTreatment'),
            Fields::string($payload, 'taxRate'),
            Fields::string($payload, 'taxLabel'),
            Fields::string($payload, 'effectiveFrom'),
        );
    }
}
