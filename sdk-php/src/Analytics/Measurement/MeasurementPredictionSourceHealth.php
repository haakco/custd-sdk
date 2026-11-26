<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionSourceHealth
{
    public function __construct(
        public int $consecutiveFailures,
        public string $displayName,
        public string $sourceKey,
        public string $status,
        public ?string $lastAttemptAt = null,
        public ?string $lastSucceededAt = null,
        public ?string $nextEligibleAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'consecutiveFailures'),
            Fields::string($payload, 'displayName'),
            Fields::string($payload, 'sourceKey'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'lastAttemptAt'),
            Fields::optionalString($payload, 'lastSucceededAt'),
            Fields::optionalString($payload, 'nextEligibleAt'),
        );
    }
}
