<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationPoint
{
    public function __construct(
        public string $x,
        public ?string $date = null,
        public ?string $lowerDate = null,
        public ?float $lowerValue = null,
        public ?bool $selected = null,
        public ?string $snapshotUuid = null,
        public ?string $upperDate = null,
        public ?float $upperValue = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'x'),
            Fields::optionalString($payload, 'date'),
            Fields::optionalString($payload, 'lowerDate'),
            Fields::optionalNumber($payload, 'lowerValue'),
            Fields::optionalBoolean($payload, 'selected'),
            Fields::optionalString($payload, 'snapshotUuid'),
            Fields::optionalString($payload, 'upperDate'),
            Fields::optionalNumber($payload, 'upperValue'),
            Fields::optionalNumber($payload, 'value'),
        );
    }
}
