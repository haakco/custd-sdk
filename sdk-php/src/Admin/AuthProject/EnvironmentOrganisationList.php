<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** EnvironmentOrganisationList is the named list an environment's organisation read answers with. */
final readonly class EnvironmentOrganisationList
{
    /** @param  list<EnvironmentOrganisation>  $organisations */
    public function __construct(
        public string $projectId = '',
        public string $environmentId = '',
        public array $organisations = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project environment organisations');
        $organisations = [];
        foreach (Fields::objects($object, 'organisations') as $organisation) {
            $organisations[] = EnvironmentOrganisation::fromPayload($organisation);
        }

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            $organisations,
        );
    }
}
