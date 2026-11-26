<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementObservationResult
{
    public function __construct(
        public int $rowIndex,
        public bool $success,
        public ?string $detail = null,
        public ?string $observationUuid = null,
        public ?int $status = null,
        public ?string $title = null,
        public ?string $type = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'rowIndex'),
            Fields::boolean($payload, 'success'),
            Fields::optionalString($payload, 'detail'),
            Fields::optionalString($payload, 'observationUuid'),
            Fields::optionalInteger($payload, 'status'),
            Fields::optionalString($payload, 'title'),
            Fields::optionalString($payload, 'type'),
        );
    }
}
