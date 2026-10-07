<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationSession is one session a directory holds for an application
 * principal. The list carries no session token or credential.
 */
final readonly class ApplicationSession
{
    public function __construct(
        public string $sessionId = '',
        public bool $active = false,
        public string $authenticatedAt = '',
        public string $authenticatorAssuranceLevel = '',
        public string $expiresAt = '',
        public string $issuedAt = '',
    ) {
    }

    /** @param \stdClass $payload */
    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sessionId'),
            Fields::boolean($payload, 'active'),
            Fields::optionalString($payload, 'authenticatedAt') ?? '',
            Fields::optionalString($payload, 'authenticatorAssuranceLevel') ?? '',
            Fields::optionalString($payload, 'expiresAt') ?? '',
            Fields::optionalString($payload, 'issuedAt') ?? '',
        );
    }
}
