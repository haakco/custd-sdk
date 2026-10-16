<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * EnvironmentRetainedResources is what an offboard kept, so the receipt states
 * plainly that nothing was destroyed and how much credential-store capacity stays
 * reserved.
 */
final readonly class EnvironmentRetainedResources
{
    public function __construct(
        public int $directories = 0,
        public int $organisations = 0,
        public int $memberships = 0,
        public int $invitations = 0,
        public int $profileValues = 0,
        public int $reservedSlots = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment retained resources');

        return new self(
            Fields::integer($object, 'directories'),
            Fields::integer($object, 'organisations'),
            Fields::integer($object, 'memberships'),
            Fields::integer($object, 'invitations'),
            Fields::integer($object, 'profileValues'),
            Fields::integer($object, 'reservedSlots'),
        );
    }
}
