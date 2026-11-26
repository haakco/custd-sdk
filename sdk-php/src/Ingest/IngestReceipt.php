<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/** IngestReceipt acknowledges one event accepted on POST /api/v1/events. */
final readonly class IngestReceipt
{
    public function __construct(
        public bool $success,
        public string $eventUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::boolean($payload, 'success'), Fields::string($payload, 'eventUuid'));
    }
}
