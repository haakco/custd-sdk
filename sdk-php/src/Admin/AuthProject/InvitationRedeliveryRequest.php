<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * InvitationRedeliveryRequest names one invitation whose link the caller wants
 * delivered again. It cannot carry a link: the server mints a fresh one.
 */
final readonly class InvitationRedeliveryRequest
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
