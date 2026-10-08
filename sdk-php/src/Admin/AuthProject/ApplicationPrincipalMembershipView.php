<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class ApplicationPrincipalMembershipView
{
    public function __construct(
        public string $organisationId,
        public string $organisationSlug,
        public string $organisationName,
        public string $role,
        public string $createdAt,
        public ?string $removedAt = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal export row');

        return new self(
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'organisationSlug'),
            Fields::string($object, 'organisationName'),
            Fields::string($object, 'role'),
            Fields::string($object, 'createdAt'),
            Fields::optionalString($object, 'removedAt'),
        );
    }
}
