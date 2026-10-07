<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ClientSyncStatus is the registration half of status: the application clients
 * the provider is known to hold and whether they are current.
 */
final readonly class ClientSyncStatus
{
    /**
     * @param list<string>|null $clientIds
     * @param list<ClientRegistrationStatus>|null $registrations
     */
    public function __construct(
        public ?array $clientIds = null,
        public int $revision = 0,
        public string $checkedAt = '',
        public bool $current = false,
        public ?array $registrations = null,
        public string $issuer = '',
        public string $errorCategory = '',
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $registrations = Fields::optionalObjects($payload, "registrations");

        return new self(
            Fields::optionalStrings($payload, "clientIds"),
            Fields::integer($payload, "revision"),
            Fields::string($payload, "checkedAt"),
            Fields::boolean($payload, "current"),
            $registrations === null ? null : array_map(ClientRegistrationStatus::fromPayload(...), $registrations),
            Fields::optionalString($payload, "issuer") ?? '',
            Fields::optionalString($payload, "errorCategory") ?? '',
        );
    }
}
