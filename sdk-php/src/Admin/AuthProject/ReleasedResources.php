<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ReleasedResources is what deleting a project released, grouped so the receipt documents the cascade. */
final readonly class ReleasedResources
{
    public function __construct(
        public int $environments = 0,
        public int $directories = 0,
        public int $organisations = 0,
        public int $memberships = 0,
        public int $invitations = 0,
        public int $audienceBindings = 0,
        public int $operations = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project released resources');

        return new self(
            Fields::integer($object, 'environments'),
            Fields::integer($object, 'directories'),
            Fields::integer($object, 'organisations'),
            Fields::integer($object, 'memberships'),
            Fields::integer($object, 'invitations'),
            Fields::integer($object, 'audienceBindings'),
            Fields::integer($object, 'operations'),
        );
    }
}
