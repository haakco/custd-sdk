<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * Scope is the management view of one parent-company data scope.
 *
 * The immutable `code` is the external selector event and query traffic use;
 * the UUID addresses the record for configuration.
 */
final readonly class Scope
{
    public function __construct(
        public string $uuid = '',
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
            Fields::string($payload, 'code'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'updatedAt'),
        );
    }
}
