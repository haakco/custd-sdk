<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ProjectDeletion is the receipt for a deleted project. `hosting` lists what it removed from each hosted environment. */
final readonly class ProjectDeletion
{
    /** @param list<ProjectHostingRemoval> $hosting */
    public function __construct(
        public ReleasedResources $released,
        public string $projectId = '',
        public string $slug = '',
        public string $name = '',
        public array $hosting = [],
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
            array_map(ProjectHostingRemoval::fromPayload(...), Fields::objects($object, 'hosting')),
        );
    }
}
