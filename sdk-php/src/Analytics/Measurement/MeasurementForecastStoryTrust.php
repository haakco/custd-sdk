<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryTrust
{
    public function __construct(
        public string $evidence,
        public int $observationCount,
        public int $snapshotCount,
        public string $state,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'evidence'),
            Fields::integer($payload, 'observationCount'),
            Fields::integer($payload, 'snapshotCount'),
            Fields::string($payload, 'state'),
        );
    }
}
