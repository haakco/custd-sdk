<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PublishUsageTariffRequest
{
    public function __construct(
        public string $tariffRevisionUuid,
        public string $productUuid,
        public string $description,
        public UsageMeter $meter,
        public string $effectiveFrom,
        public UsageRate $rate,
        public UsageTax $tax,
        public ?string $effectiveTo = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'tariffRevisionUuid' => $this->tariffRevisionUuid,
            'productUuid' => $this->productUuid,
            'description' => $this->description,
            'meter' => $this->meter->serialise(),
            'effectiveFrom' => $this->effectiveFrom,
            'rate' => $this->rate->serialise(),
            'tax' => $this->tax->serialise(),
        ];

        if ($this->effectiveTo !== null) {
            $payload['effectiveTo'] = $this->effectiveTo;
        }

        return $payload;
    }
}
