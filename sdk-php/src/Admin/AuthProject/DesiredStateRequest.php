<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * DesiredStateRequest is the named request DTO for both the apply and preview
 * operations on
 * /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}.
 *
 * `expectedRevision` is the revision the caller read; Custd refuses an apply
 * when the stored revision has moved.
 */
final readonly class DesiredStateRequest
{
    public function __construct(
        public DesiredState $desiredState,
        public int $expectedRevision,
    ) {
        if ($expectedRevision < 0) {
            throw new \InvalidArgumentException("custd: desired-state expectedRevision must not be negative");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "desiredState" => $this->desiredState->toPayload(),
            "expectedRevision" => $this->expectedRevision,
        ];
    }
}
