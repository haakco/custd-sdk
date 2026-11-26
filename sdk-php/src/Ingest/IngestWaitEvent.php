<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestWaitEvent
{
    public function __construct(
        public string $type,
        public string $event,
        public int $count,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'type'),
            Fields::string($payload, 'event'),
            Fields::integer($payload, 'count'),
        );
    }
}
