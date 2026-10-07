<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * SessionRevocation is the response to revoking sessions. `revoked` is the
 * number of sessions ended.
 */
final readonly class SessionRevocation
{
    public function __construct(
        public string $projectId = '',
        public string $directoryId = '',
        public string $principalId = '',
        public int $revoked = 0,
        public string $sessionId = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application session revocation');

        return new self(
            Fields::string($object, 'projectId'),
            Fields::string($object, 'directoryId'),
            Fields::string($object, 'principalId'),
            Fields::integer($object, 'revoked'),
            Fields::optionalString($object, 'sessionId') ?? '',
        );
    }
}
