<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * MembershipRevocation is the response to ending a membership. The membership
 * row is kept with `removedAt` stamped rather than deleted.
 */
final readonly class MembershipRevocation
{
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public string $directoryId = '',
        public string $principalId = '',
        public string $organisationId = '',
        public string $removedAt = '',
        public bool $removed = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application membership revocation');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'removedAt'),
            Fields::boolean($object, 'removed'),
        );
    }
}
