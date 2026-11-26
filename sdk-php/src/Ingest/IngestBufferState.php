<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestBufferState
{
    public function __construct(
        public IngestJetStreamState $jetstream,
        public IngestSegmentState $segments,
        public IngestWorkerState $compaction,
        public IngestWorkerState $rollups,
        public IngestObjectStorageState $s3,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            IngestJetStreamState::fromPayload(Fields::object($payload, 'jetstream')),
            IngestSegmentState::fromPayload(Fields::object($payload, 'segments')),
            IngestWorkerState::fromPayload(Fields::object($payload, 'compaction')),
            IngestWorkerState::fromPayload(Fields::object($payload, 'rollups')),
            IngestObjectStorageState::fromPayload(Fields::object($payload, 's3')),
        );
    }
}
