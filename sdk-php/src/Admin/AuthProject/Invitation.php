<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Invitation is one invitation as a caller sees it. It never carries the token or
 * its hash. `delivered` is only meaningful on the response to issuing an
 * invitation; nothing stores it, so a list cannot report it.
 */
final readonly class Invitation
{
    public function __construct(
        public string $invitationId = '',
        public string $email = '',
        public string $membershipRole = '',
        public string $poolId = '',
        public string $organisationId = '',
        public string $expiresAt = '',
        public string $createdAt = '',
        public string $state = '',
        public bool $delivered = false,
        public ?string $acceptedPrincipalId = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project invitation');

        return new self(
            Fields::string($object, 'invitationId'),
            Fields::string($object, 'email'),
            Fields::string($object, 'membershipRole'),
            Fields::string($object, 'poolId'),
            Fields::string($object, 'organisationId'),
            Fields::string($object, 'expiresAt'),
            Fields::string($object, 'createdAt'),
            Fields::string($object, 'state'),
            Fields::optionalBoolean($object, 'delivered') ?? false,
            Fields::optionalString($object, 'acceptedPrincipalId'),
        );
    }
}
