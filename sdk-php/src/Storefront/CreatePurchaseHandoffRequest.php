<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class CreatePurchaseHandoffRequest
{
    public function __construct(
        public string $orderReference,
        public string $offerUuid,
        public Money $amount,
    ) {
    }

    /** @return array{orderReference:string, offerUuid:string, amount:array{currency:string, amountMinor:string}} */
    public function serialise(): array
    {
        return [
            'orderReference' => $this->orderReference,
            'offerUuid' => $this->offerUuid,
            'amount' => $this->amount->serialise(),
        ];
    }
}
