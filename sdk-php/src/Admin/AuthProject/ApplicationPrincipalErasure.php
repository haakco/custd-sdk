<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

final readonly class ApplicationPrincipalErasure
{
    public function __construct(
        public string $projectId,
        public string $environmentId,
        public string $directoryId,
        public string $principalId,
        public string $status,
        public int $invitations,
        public int $magicLinks,
        public int $memberships,
        public int $mappings,
        public int $profileValues,
        public int $principals,
        public int $revision,
        public bool $replayed,
        public bool $countsRecorded,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal lifecycle receipt');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'environmentId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            Fields::string($object, 'status'),
            Fields::integer($object, 'invitations'),
            Fields::integer($object, 'magicLinks'),
            Fields::integer($object, 'memberships'),
            Fields::integer($object, 'mappings'),
            Fields::integer($object, 'profileValues'),
            Fields::integer($object, 'principals'),
            Fields::integer($object, 'revision'),
            Fields::boolean($object, 'replayed'),
            Fields::boolean($object, 'countsRecorded'),
        );
    }
}
