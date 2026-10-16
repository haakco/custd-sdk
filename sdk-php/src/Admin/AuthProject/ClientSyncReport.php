<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ClientSyncReport is one reconcile's outcome. `superseded` reports that the
 * environment's configuration moved while this run was writing.
 */
final readonly class ClientSyncReport
{
    /** @param  list<ClientSyncRegistration>  $clients */
    public function __construct(
        public string $environmentId = '',
        public int $revision = 0,
        public string $checkedAt = '',
        public string $errorCategory = '',
        public bool $superseded = false,
        public array $clients = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project client sync report');
        // A successful reconcile with no registrations reports "clients": null,
        // so a legitimate null is normalized to an empty collection while a
        // present list keeps its element validation.
        $clients = [];
        foreach (Fields::optionalObjects($object, 'clients') ?? [] as $client) {
            $clients[] = ClientSyncRegistration::fromPayload($client);
        }

        return new self(
            Fields::string($object, 'environmentId'),
            Fields::integer($object, 'revision'),
            Fields::string($object, 'checkedAt'),
            Fields::optionalString($object, 'errorCategory') ?? '',
            Fields::boolean($object, 'superseded'),
            $clients,
        );
    }
}
