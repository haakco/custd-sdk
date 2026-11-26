<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

use HaakCo\Custd\Fields;

final readonly class EmailRelay
{
    public function __construct(
        public string $createdAt,
        public bool $enabled,
        public string $fromAddress,
        public string $fromDisplayName,
        public bool $hasCredential,
        public string $host,
        public int $port,
        public string $tlsMode,
        public string $updatedAt,
        public string $username,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'fromAddress'),
            Fields::string($payload, 'fromDisplayName'),
            Fields::boolean($payload, 'hasCredential'),
            Fields::string($payload, 'host'),
            Fields::integer($payload, 'port'),
            Fields::string($payload, 'tlsMode'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'username'),
        );
    }
}
