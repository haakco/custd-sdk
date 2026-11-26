<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestJetStreamCluster
{
    public function __construct(
        public int $replicaCount,
        public bool $replicated,
        public bool $allReplicasCurrent,
        public ?string $leader = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'replicaCount'),
            Fields::boolean($payload, 'replicated'),
            Fields::boolean($payload, 'allReplicasCurrent'),
            Fields::optionalString($payload, 'leader'),
        );
    }
}
