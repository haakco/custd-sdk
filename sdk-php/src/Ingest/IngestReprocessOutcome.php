<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

final readonly class IngestReprocessOutcome
{
    public function __construct(
        public string $uuid,
        public bool $success,
        public ?string $error = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'uuid'),
            Fields::boolean($payload, 'success'),
            Fields::optionalString($payload, 'error'),
        );
    }
}
