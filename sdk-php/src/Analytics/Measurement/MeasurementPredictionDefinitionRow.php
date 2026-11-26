<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionDefinitionRow
{
    public function __construct(
        public string $definitionKey,
        public string $displayName,
        public bool $isPaused,
        public string $status,
        public string $updatedAt,
        public string $uuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionKey'),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'isPaused'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'uuid'),
        );
    }
}
