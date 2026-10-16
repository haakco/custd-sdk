<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * InvitationIssueRequest invites one address into a directory. It cannot name a
 * project, environment, token or state: the path resolves the scope, the
 * configuration resolves the directory, and the token is the server's own.
 */
final readonly class InvitationIssueRequest
{
    public function __construct(
        public string $poolId,
        public string $organisationId,
        public string $email,
        public string $membershipRole,
        public int $expiresInSeconds,
    ) {
        if (trim($poolId) === '' || trim($organisationId) === '' || trim($email) === '') {
            throw new \InvalidArgumentException('custd: auth-project invitation needs a pool, organisation and address');
        }
        if (trim($membershipRole) === '') {
            throw new \InvalidArgumentException('custd: auth-project invitation needs a membership role');
        }
        if ($expiresInSeconds <= 0) {
            throw new \InvalidArgumentException('custd: auth-project invitation expiry must be positive');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            'poolId' => $this->poolId,
            'organisationId' => $this->organisationId,
            'email' => $this->email,
            'membershipRole' => $this->membershipRole,
            'expiresInSeconds' => $this->expiresInSeconds,
        ];
    }
}
