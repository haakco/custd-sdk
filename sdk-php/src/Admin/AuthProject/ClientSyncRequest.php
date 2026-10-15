<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ClientSyncRequest is the body of clients/reconcile: the revision the caller
 * read. It is required and refused unless it matches, so a caller acting on an
 * older read cannot register clients for configuration that has already changed.
 */
final readonly class ClientSyncRequest
{
    public function __construct(public int $expectedRevision)
    {
        if ($expectedRevision < 0) {
            throw new \InvalidArgumentException('custd: client sync expectedRevision must not be negative');
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ['expectedRevision' => $this->expectedRevision];
    }
}
