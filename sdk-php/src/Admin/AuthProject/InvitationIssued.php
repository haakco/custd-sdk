<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * InvitationIssued is the response to issuing one invitation. `inviteUrl` is
 * returned exactly once, here: only the token's hash is stored, so a later read
 * cannot recover it.
 */
final readonly class InvitationIssued
{
    public function __construct(
        public Invitation $invitation,
        public string $inviteUrl = '',
        public bool $replayed = false,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project invitation issued');

        return new self(
            Invitation::fromPayload(Fields::object($object, 'invitation')),
            Fields::optionalString($object, 'inviteUrl') ?? '',
            Fields::boolean($object, 'replayed'),
        );
    }
}
