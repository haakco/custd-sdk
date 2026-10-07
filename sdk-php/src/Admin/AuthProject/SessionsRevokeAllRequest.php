<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * SessionsRevokeAllRequest is the body of
 * POST .../principals/{providerSubject}/sessions/revoke-all. `confirm` must be
 * true: a missing field is never read as the strongest action.
 */
final readonly class SessionsRevokeAllRequest
{
    public function __construct(public bool $confirm)
    {
        if (!$confirm) {
            throw new \InvalidArgumentException("custd: auth-project revoke-all requires an explicit confirmation");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["confirm" => $this->confirm];
    }
}
