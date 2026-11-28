<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageTariffRevision
{
    public function __construct(
        public string $tariffRevisionUuid,
        public string $productUuid,
        public string $description,
        public UsageMeter $meter,
        public string $effectiveFrom,
        public UsageRate $rate,
        public UsageTax $tax,
        public string $sellerCompanyUuid,
        public string $appUuid,
        public ?string $effectiveTo = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tariffRevisionUuid'),
            Fields::string($payload, 'productUuid'),
            Fields::string($payload, 'description'),
            UsageMeter::fromPayload(Fields::object($payload, 'meter')),
            Fields::string($payload, 'effectiveFrom'),
            UsageRate::fromPayload(Fields::object($payload, 'rate')),
            UsageTax::fromPayload(Fields::object($payload, 'tax')),
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'appUuid'),
            Fields::optionalString($payload, 'effectiveTo'),
        );
    }
}
