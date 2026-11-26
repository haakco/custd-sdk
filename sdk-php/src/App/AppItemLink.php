<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemLink
{
    public function __construct(
        public string $createdAt,
        public string $linkUuid,
        public string $role,
        public ?string $shareToken = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'linkUuid'),
            Fields::string($payload, 'role'),
            Fields::optionalString($payload, 'shareToken'),
        );
    }
}
