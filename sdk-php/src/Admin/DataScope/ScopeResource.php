<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * ScopeResource is the management view of one resource inside a data scope.
 */
final readonly class ScopeResource
{
    public function __construct(
        public string $uuid = '',
        public string $scopeUuid = '',
        public string $code = '',
        public string $name = '',
        public string $status = '',
        public string $createdAt = '',
        public string $updatedAt = '',
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'uuid'),
            Fields::string($payload, 'scopeUuid'),
            Fields::string($payload, 'code'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'updatedAt'),
        );
    }
}
