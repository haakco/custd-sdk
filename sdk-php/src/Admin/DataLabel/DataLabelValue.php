<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelValue
{
    public function __construct(
        public string $createdAt,
        public string $description,
        public string $displayName,
        public bool $enabled,
        public string $updatedAt,
        public string $uuid,
        public string $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'uuid'),
            Fields::string($payload, 'value'),
        );
    }
}
