<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestJetStreamStreamState
{
    public function __construct(
        public int $messages,
        public int $bytes,
        public int $subjects,
        public IngestJetStreamCluster $cluster,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'messages'),
            Fields::integer($payload, 'bytes'),
            Fields::integer($payload, 'subjects'),
            IngestJetStreamCluster::fromPayload(Fields::object($payload, 'cluster')),
        );
    }
}
