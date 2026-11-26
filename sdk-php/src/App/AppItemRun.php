<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemRun
{
    public function __construct(
        public string $createdAt,
        public string $name,
        public string $runUuid,
        public string $status,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'runUuid'),
            Fields::string($payload, 'status'),
        );
    }
}
