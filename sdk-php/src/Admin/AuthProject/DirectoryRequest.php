<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * DirectoryRequest is the body of a directory action. It cannot name a store, a
 * runtime URL or a state: those are server-owned. `expectedRevision` is the
 * revision the caller read.
 */
final readonly class DirectoryRequest
{
    public function __construct(
        public string $poolId,
        public int $expectedRevision,
    ) {
        if (trim($poolId) === '') {
            throw new \InvalidArgumentException('custd: auth-project directory poolId is required');
        }
        if ($expectedRevision < 0) {
            throw new \InvalidArgumentException('custd: auth-project directory expectedRevision must not be negative');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['poolId' => $this->poolId, 'expectedRevision' => $this->expectedRevision];
    }
}
