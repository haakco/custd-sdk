<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DurationObservationIdentity
{
    public function __construct(
        public string $blockUuid,
        public string $idempotencyKey,
        public string $observationUuid,
        public string $planUuid,
        public string $runUuid,
        public string $semanticKey,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'blockUuid'),
            Fields::string($payload, 'idempotencyKey'),
            Fields::string($payload, 'observationUuid'),
            Fields::string($payload, 'planUuid'),
            Fields::string($payload, 'runUuid'),
            Fields::string($payload, 'semanticKey'),
        );
    }
}
