<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ClientRegistrationStatus is one audience's provider registration read back
 * from status.
 *
 * `clientId` is the derived `custd-app-<environmentID>-<audienceSlug>` the
 * binding resolves to.
 */
final readonly class ClientRegistrationStatus
{
    public function __construct(
        public string $audience,
        public string $clientId,
        public bool $observed,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "audience"),
            Fields::string($payload, "clientId"),
            Fields::boolean($payload, "observed"),
        );
    }
}
