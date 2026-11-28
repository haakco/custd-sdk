<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PublishOffer
{
    public function __construct(
        public string $name,
        public string $billingInterval,
        public UnitPrice $unitPrice,
        public string $taxRate,
        public string $taxLabel,
        public ?string $offerUuid = null,
        public ?string $effectiveFrom = null,
        public ?string $complementaryForOfferUuid = null,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return array_filter([
            'name' => $this->name,
            'billingInterval' => $this->billingInterval,
            'unitPrice' => $this->unitPrice->serialise(),
            'taxRate' => $this->taxRate,
            'taxLabel' => $this->taxLabel,
            'offerUuid' => $this->offerUuid,
            'effectiveFrom' => $this->effectiveFrom,
            'complementaryForOfferUuid' => $this->complementaryForOfferUuid,
        ], static fn (mixed $field): bool => $field !== null);
    }
}
