<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestDatabaseState
{
    public function __construct(
        public IngestDatabasePoolState $core,
        public IngestDatabasePoolState $raw,
        public int $bytesPerEvent,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            IngestDatabasePoolState::fromPayload(Fields::object($payload, 'core')),
            IngestDatabasePoolState::fromPayload(Fields::object($payload, 'raw')),
            Fields::integer($payload, 'bytesPerEvent'),
        );
    }
}
