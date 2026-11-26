<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\User;

use HaakCo\Custd\Fields;

final readonly class AdminUserRole
{
    public function __construct(
        public string $description,
        public string $name,
        public string $slug,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'description'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'slug'),
        );
    }
}
