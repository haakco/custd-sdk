<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupJobProof is the proof a completed job recorded; proof is the server's proof document, kept exactly as
 * stored.
 */
final readonly class CleanupJobProof
{
    public function __construct(
        public string $jobUuid,
        public string $status,
        public mixed $proof = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'jobUuid'),
            Fields::string($payload, 'status'),
            Fields::raw($payload, 'proof'),
        );
    }
}
