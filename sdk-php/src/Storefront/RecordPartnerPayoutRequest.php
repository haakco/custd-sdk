<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class RecordPartnerPayoutRequest
{
    public function __construct(
        public string $externalReference,
        public Money $amount,
        public string $paidAt,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'externalReference' => $this->externalReference,
            'amount' => $this->amount->serialise(),
            'paidAt' => $this->paidAt,
        ];

        return $payload;
    }
}
