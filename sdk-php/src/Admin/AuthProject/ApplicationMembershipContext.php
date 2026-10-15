<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ApplicationMembershipContext is the set of organisations one application principal may act for. */
final readonly class ApplicationMembershipContext
{
    /** @param  list<ApplicationMembershipChoice>  $memberships */
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public string $directoryId = '',
        public string $principalId = '',
        public array $memberships = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application membership context');
        $memberships = [];
        foreach (Fields::objects($object, 'memberships') as $membership) {
            $memberships[] = ApplicationMembershipChoice::fromPayload($membership);
        }

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            $memberships,
        );
    }
}
