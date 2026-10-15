<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ClientSyncRegistration is one audience's reconcile outcome, reporting what the provider was observed to hold. */
final readonly class ClientSyncRegistration
{
    public function __construct(
        public string $audience = '',
        public string $clientId = '',
        public string $action = '',
        public string $reason = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project client sync registration');

        return new self(
            Fields::string($object, 'audience'),
            Fields::string($object, 'clientId'),
            Fields::string($object, 'action'),
            Fields::optionalString($object, 'reason') ?? '',
        );
    }
}
