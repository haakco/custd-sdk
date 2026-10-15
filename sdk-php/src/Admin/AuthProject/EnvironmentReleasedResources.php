<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** EnvironmentReleasedResources is what deleting one environment released, grouped for the receipt. */
final readonly class EnvironmentReleasedResources
{
    public function __construct(
        public int $directories = 0,
        public int $organisations = 0,
        public int $memberships = 0,
        public int $invitations = 0,
        public int $audienceBindings = 0,
        public int $operations = 0,
        public int $profileValues = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment released resources');

        return new self(
            Fields::integer($object, 'directories'),
            Fields::integer($object, 'organisations'),
            Fields::integer($object, 'memberships'),
            Fields::integer($object, 'invitations'),
            Fields::integer($object, 'audienceBindings'),
            Fields::integer($object, 'operations'),
            Fields::integer($object, 'profileValues'),
        );
    }
}
