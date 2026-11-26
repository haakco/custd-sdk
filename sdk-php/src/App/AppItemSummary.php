<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemSummary
{
    public function __construct(
        public string $expiresAt,
        public int $idleExpirySeconds,
        public string $itemUuid,
        public string $kind,
        public string $name,
        public string $ownership,
        public string $role,
        public string $status,
        public string $updatedAt,
        public int $version,
        public ?string $seriesCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'expiresAt'),
            Fields::integer($payload, 'idleExpirySeconds'),
            Fields::string($payload, 'itemUuid'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'ownership'),
            Fields::string($payload, 'role'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'updatedAt'),
            Fields::integer($payload, 'version'),
            Fields::optionalString($payload, 'seriesCode'),
        );
    }
}
