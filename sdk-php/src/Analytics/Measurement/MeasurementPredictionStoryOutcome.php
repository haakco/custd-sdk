<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionStoryOutcome
{
    public function __construct(
        public bool $isLateEvidence,
        public int $observedValue,
        public string $resolution,
        public string $runUuid,
        public ?string $outcomeKind = null,
        public ?string $resolvedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'isLateEvidence'),
            Fields::integer($payload, 'observedValue'),
            Fields::string($payload, 'resolution'),
            Fields::string($payload, 'runUuid'),
            Fields::optionalString($payload, 'outcomeKind'),
            Fields::optionalString($payload, 'resolvedAt'),
        );
    }
}
