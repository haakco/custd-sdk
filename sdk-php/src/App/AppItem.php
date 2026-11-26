<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItem
{
    /**
     * @param AppItemOwnership::* $ownership
     */
    public function __construct(
        public string $expiresAt,
        public int $idleExpirySeconds,
        public string $itemUuid,
        public string $kind,
        public string $ownership,
        public string $role,
        public string $updatedAt,
        public int $version,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'expiresAt'),
            Fields::integer($payload, 'idleExpirySeconds'),
            Fields::string($payload, 'itemUuid'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'ownership'),
            Fields::string($payload, 'role'),
            Fields::string($payload, 'updatedAt'),
            Fields::integer($payload, 'version'),
        );
    }
}
