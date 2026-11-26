<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class ProjectEstimate
{
    public function __construct(
        public string $estimateUuid,
        public string $estimatedAt,
        public string $highDate,
        public string $lowDate,
        public string $note,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'estimateUuid'),
            Fields::string($payload, 'estimatedAt'),
            Fields::string($payload, 'highDate'),
            Fields::string($payload, 'lowDate'),
            Fields::string($payload, 'note'),
        );
    }
}
