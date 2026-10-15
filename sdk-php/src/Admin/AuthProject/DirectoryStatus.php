<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * DirectoryStatus is the environment's identity directories and their
 * credential-store readiness. `ready` is true only when every directory that has
 * a store row is serving.
 */
final readonly class DirectoryStatus
{
    /** @param  list<DirectoryView>  $directories */
    public function __construct(
        public DirectoryCapacity $capacity,
        public string $projectId = '',
        public string $environmentId = '',
        public int $revision = 0,
        public array $directories = [],
        public bool $ready = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project directory status');
        $directories = [];
        foreach (Fields::objects($object, 'directories') as $directory) {
            $directories[] = DirectoryView::fromPayload($directory);
        }

        return new self(
            DirectoryCapacity::fromPayload(Fields::object($object, 'capacity')),
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::integer($object, 'revision'),
            $directories,
            Fields::boolean($object, 'ready'),
        );
    }
}
