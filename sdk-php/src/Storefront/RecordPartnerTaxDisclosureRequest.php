<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class RecordPartnerTaxDisclosureRequest
{
    public function __construct(
        public string $disclosureUuid,
        public PartnerTaxStatus $status,
        public string $jurisdiction,
        public ?string $registrationNumber = null,
        public ?string $effectiveFrom = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'disclosureUuid' => $this->disclosureUuid,
            'status' => $this->status->value,
            'jurisdiction' => $this->jurisdiction,
        ];

        if ($this->registrationNumber !== null) {
            $payload['registrationNumber'] = $this->registrationNumber;
        }

        if ($this->effectiveFrom !== null) {
            $payload['effectiveFrom'] = $this->effectiveFrom;
        }

        return $payload;
    }
}
