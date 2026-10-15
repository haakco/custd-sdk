<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** InvitationListResponse is an environment's invitations, newest first. */
final readonly class InvitationListResponse
{
    /** @param  list<Invitation>  $invitations */
    public function __construct(public array $invitations = [])
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'auth-project invitation list');
        $invitations = [];
        foreach (Fields::objects($object, 'invitations') as $invitation) {
            $invitations[] = Invitation::fromPayload($invitation);
        }

        return new self($invitations);
    }
}
