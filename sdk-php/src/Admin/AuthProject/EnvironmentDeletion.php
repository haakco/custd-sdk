<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * EnvironmentDeletion is the receipt for a deleted environment. It names both the
 * project and the one environment it removed, so a caller can tell an
 * environment deletion from a project deletion without reading the request back.
 */
final readonly class EnvironmentDeletion
{
    public function __construct(
        public EnvironmentReleasedResources $released,
        public string $projectId = '',
        public string $projectSlug = '',
        public string $environmentId = '',
        public string $slug = '',
        public string $name = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment deletion');

        return new self(
            EnvironmentReleasedResources::fromPayload(Fields::object($object, 'released')),
            Fields::string($object, 'projectId'),
            Fields::string($object, 'projectSlug'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'slug'),
            Fields::string($object, 'name'),
        );
    }
}
