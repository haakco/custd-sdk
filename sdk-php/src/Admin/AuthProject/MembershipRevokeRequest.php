<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * MembershipRevokeRequest is the body of
 * POST .../principals/{providerSubject}/memberships/revoke. The project,
 * environment, directory and provider subject come from the address, so the
 * body names only the organisation.
 */
final readonly class MembershipRevokeRequest
{
    public function __construct(
        public string $organisationId,
        public string $reason = '',
    ) {
        if (trim($organisationId) === "") {
            throw new \InvalidArgumentException("custd: auth-project organisationId is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        $payload = ["organisationId" => $this->organisationId];
        if (trim($this->reason) !== "") {
            $payload["reason"] = $this->reason;
        }

        return $payload;
    }
}
