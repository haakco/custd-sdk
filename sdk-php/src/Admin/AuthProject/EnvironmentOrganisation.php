<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** EnvironmentOrganisation is one organisation an environment's directory holds; it carries no member data. */
final readonly class EnvironmentOrganisation
{
    public function __construct(
        public string $organisationId = '',
        public string $slug = '',
        public string $name = '',
        public string $identityPoolId = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment organisation');

        return new self(
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'slug'),
            Fields::string($object, 'name'),
            Fields::string($object, 'identityPoolId'),
        );
    }
}
