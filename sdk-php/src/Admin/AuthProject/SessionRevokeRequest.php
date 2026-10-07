<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * SessionRevokeRequest is the body of
 * POST .../principals/{providerSubject}/sessions/revoke. The session identifier
 * is checked against the principal's own sessions before it is revoked.
 */
final readonly class SessionRevokeRequest
{
    public function __construct(public string $sessionId)
    {
        if (trim($sessionId) === "") {
            throw new \InvalidArgumentException("custd: auth-project sessionId is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["sessionId" => $this->sessionId];
    }
}
