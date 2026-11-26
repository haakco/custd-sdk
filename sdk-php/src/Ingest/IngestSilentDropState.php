<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestSilentDropState
{
    public function __construct(
        public float $dropRatePerSecond,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'dropRatePerSecond'),
        );
    }
}
