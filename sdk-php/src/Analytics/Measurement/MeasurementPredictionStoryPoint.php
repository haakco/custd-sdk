<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionStoryPoint
{
    public function __construct(
        public string $asOfAt,
        public float $probability,
        public string $runUuid,
        public ?string $horizonEndAt = null,
        public ?string $inputHash = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'asOfAt'),
            Fields::number($payload, 'probability'),
            Fields::string($payload, 'runUuid'),
            Fields::optionalString($payload, 'horizonEndAt'),
            Fields::optionalString($payload, 'inputHash'),
        );
    }
}
