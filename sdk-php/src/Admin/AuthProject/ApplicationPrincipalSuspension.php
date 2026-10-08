<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class ApplicationPrincipalSuspension
{
    public function __construct(
        public string $projectId,
        public string $environmentId,
        public string $directoryId,
        public string $principalId,
        public bool $enabled,
        public int $sessionsRevoked,
        public int $revision,
        public bool $replayed,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal lifecycle receipt');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            Fields::boolean($object, 'enabled'),
            Fields::integer($object, 'sessionsRevoked'),
            Fields::integer($object, 'revision'),
            Fields::boolean($object, 'replayed'),
        );
    }
}
