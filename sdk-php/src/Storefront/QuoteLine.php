<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class QuoteLine
{
    public function __construct(
        public int $lineNumber,
        public string $offerUuid,
        public string $priceRevisionUuid,
        public string $description,
        public string $quantity,
        public UnitPrice $unitPrice,
        public string $extensionRounding,
        public ServicePeriod $servicePeriod,
        public Money $netAmount,
        public Tax $tax,
        public Money $grossAmount,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'lineNumber'),
            Fields::string($payload, 'offerUuid'),
            Fields::string($payload, 'priceRevisionUuid'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'quantity'),
            UnitPrice::fromPayload(Fields::object($payload, 'unitPrice')),
            Fields::string($payload, 'extensionRounding'),
            ServicePeriod::fromPayload(Fields::object($payload, 'servicePeriod')),
            Money::fromPayload(Fields::object($payload, 'netAmount')),
            Tax::fromPayload(Fields::object($payload, 'tax')),
            Money::fromPayload(Fields::object($payload, 'grossAmount')),
        );
    }
}
