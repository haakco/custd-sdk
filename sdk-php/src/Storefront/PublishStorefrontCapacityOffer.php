<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PublishStorefrontCapacityOffer
{
    public function __construct(
        public string $offerUuid,
        public string $name,
        public string $billingInterval,
        public UnitPrice $unitPrice,
        public string $taxRate,
        public string $taxLabel,
        public DataSpaceCapacity $dataSpaceCapacity,
        public ?string $effectiveFrom = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'offerUuid' => $this->offerUuid,
            'name' => $this->name,
            'billingInterval' => $this->billingInterval,
            'unitPrice' => $this->unitPrice->serialise(),
            'taxRate' => $this->taxRate,
            'taxLabel' => $this->taxLabel,
            'dataSpaceCapacity' => $this->dataSpaceCapacity->serialise(),
        ];

        if ($this->effectiveFrom !== null) {
            $payload['effectiveFrom'] = $this->effectiveFrom;
        }

        return $payload;
    }
}
