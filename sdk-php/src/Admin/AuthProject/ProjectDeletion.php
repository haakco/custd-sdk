<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ProjectDeletion is the receipt for a deleted project. */
final readonly class ProjectDeletion
{
    public function __construct(
        public ReleasedResources $released,
        public string $projectId = '',
        public string $slug = '',
        public string $name = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project deletion');

        return new self(
            ReleasedResources::fromPayload(Fields::object($object, 'released')),
            Fields::string($object, 'projectId'),
            Fields::string($object, 'slug'),
            Fields::string($object, 'name'),
        );
    }
}
