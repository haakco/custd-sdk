<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Offer
{
    public function __construct(
        public string $offerUuid,
        public string $name,
        public string $billingInterval,
        public PriceRevision $priceRevision,
        public ?DataSpaceCapacity $dataSpaceCapacity,
        public ?string $complementaryForOfferUuid,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'offerUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'billingInterval'),
            PriceRevision::fromPayload(Fields::object($payload, 'priceRevision')),
            ($record = Fields::optionalObject($payload, 'dataSpaceCapacity')) === null ? null : DataSpaceCapacity::fromPayload($record),
            Fields::optionalString($payload, 'complementaryForOfferUuid'),
        );
    }
}
