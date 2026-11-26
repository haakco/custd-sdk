<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupApproval is who approved a cleanup job and until when.
 */
final readonly class CleanupApproval
{
    public function __construct(
        public string $Identity,
        public string $ExpiresAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'Identity'),
            Fields::string($payload, 'ExpiresAt'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'Identity' => $this->Identity,
            'ExpiresAt' => $this->ExpiresAt,
        ];

        return $body;
    }
}
