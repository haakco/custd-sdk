<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementProjectDelivery
{
    public function __construct(
        public string $definitionOfDone,
        public ?string $completedAt = null,
        public ?string $targetDate = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionOfDone'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'targetDate'),
        );
    }
}
