<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** InvitationRevocationRequest addresses one invitation to withdraw. */
final readonly class InvitationRevocationRequest
{
    public function __construct(public string $invitationId)
    {
        if (trim($invitationId) === '') {
            throw new \InvalidArgumentException('custd: auth-project invitationId is required');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['invitationId' => $this->invitationId];
    }
}
