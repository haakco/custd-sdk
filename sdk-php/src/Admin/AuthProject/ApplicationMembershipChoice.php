<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ApplicationMembershipChoice is one organisation an application principal may act for, with its role there. */
final readonly class ApplicationMembershipChoice
{
    public function __construct(
        public string $organisationId = '',
        public string $organisationSlug = '',
        public string $organisationName = '',
        public string $role = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application membership choice');

        return new self(
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'organisationSlug'),
            Fields::string($object, 'organisationName'),
            Fields::string($object, 'role'),
        );
    }
}
