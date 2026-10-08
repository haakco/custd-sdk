<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** All public identities and application data; completeness is stated for each identity. */
final readonly class ApplicationPrincipalExport
{
    /**
     * @param list<ApplicationPrincipalIdentityExport>|null $identities
     * @param list<ApplicationPrincipalMembershipView>|null $memberships
     * @param list<ApplicationPrincipalProfileValueView>|null $profileValues
     */
    public function __construct(
        public string $projectId,
        public string $environmentId,
        public string $directoryId,
        public string $principalId,
        public bool $enabled,
        public string $createdAt,
        public ?array $identities,
        public ?array $memberships,
        public ?array $profileValues,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal export');
        $identities = Fields::optionalObjects($object, 'identities');
        $memberships = Fields::optionalObjects($object, 'memberships');
        $values = Fields::optionalObjects($object, 'profileValues');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            Fields::boolean($object, 'enabled'),
            Fields::string($object, 'createdAt'),
            $identities === null ? null : array_map(ApplicationPrincipalIdentityExport::fromPayload(...), $identities),
            $memberships === null ? null : array_map(ApplicationPrincipalMembershipView::fromPayload(...), $memberships),
            $values === null ? null : array_map(ApplicationPrincipalProfileValueView::fromPayload(...), $values),
        );
    }
}
