<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class DataSpaceCapacity
{
    public function __construct(
        public int $extraSpacesPerUnit,
        public int $extraProducersPerSpacePerUnit,
    ) {}

    /** @return array{extraSpacesPerUnit:int, extraProducersPerSpacePerUnit:int} */
    public function serialise(): array
    {
        return [
            'extraSpacesPerUnit' => $this->extraSpacesPerUnit,
            'extraProducersPerSpacePerUnit' => $this->extraProducersPerSpacePerUnit,
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'extraSpacesPerUnit'),
            Fields::integer($payload, 'extraProducersPerSpacePerUnit'),
        );
    }
}
