<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class ApplicationPrincipalIdentityExport
{
    /** @param list<ApplicationIdentityTrait>|null $traits */
    public function __construct(
        public string $providerIssuer,
        public string $providerSubject,
        public ApplicationIdentityTraitsStatus $traitsStatus,
        public ?array $traits,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal identity export');
        $traits = Fields::optionalObjects($object, 'traits');

        return new self(
            Fields::string($object, 'providerIssuer'),
            Fields::string($object, 'providerSubject'),
            ApplicationIdentityTraitsStatus::from(Fields::string($object, 'traitsStatus')),
            $traits === null ? null : array_map(ApplicationIdentityTrait::fromPayload(...), $traits),
        );
    }
}
