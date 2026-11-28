<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class RecordPartnerSettlementPreferenceRequest
{
    public function __construct(
        public string $preferenceUuid,
        public PartnerSettlementMode $mode,
        public ?string $effectiveFrom = null,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'preferenceUuid' => $this->preferenceUuid,
            'mode' => $this->mode->value,
        ];

        if ($this->effectiveFrom !== null) {
            $payload['effectiveFrom'] = $this->effectiveFrom;
        }

        return $payload;
    }
}
