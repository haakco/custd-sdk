<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class SnapshotColumn
{
    public function __construct(
        public string $key,
        public string $label,
        public bool $nullable,
        public string $type,
        public ?string $description = null,
        public ?string $unit = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::boolean($payload, 'nullable'),
            Fields::string($payload, 'type'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'unit'),
        );
    }
}
