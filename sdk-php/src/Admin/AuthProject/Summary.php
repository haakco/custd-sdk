<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Summary is one project and the environment the call is scoped to.
 */
final readonly class Summary
{
    public function __construct(
        public string $projectId = '',
        public string $slug = '',
        public string $name = '',
        public string $environmentId = '',
        public string $environmentSlug = '',
        public string $identityMode = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project summary');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'slug'),
            Fields::string($object, 'name'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'environmentSlug'),
            Fields::string($object, 'identityMode'),
        );
    }
}
