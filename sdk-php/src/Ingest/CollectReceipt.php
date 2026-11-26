<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/** CollectReceipt acknowledges one collected browser event. */
final readonly class CollectReceipt
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
