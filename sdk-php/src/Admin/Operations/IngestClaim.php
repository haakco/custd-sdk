<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class IngestClaim
{
    public function __construct(
        public int $byteCount,
        public int $claimAttempts,
        public int $eventCount,
        public int $objectId,
        public string $objectUuid,
        public string $processingState,
        public string $windowStart,
        public ?string $claimExpiresAt = null,
        public ?string $failedAt = null,
        public ?string $failureClass = null,
        public ?string $processedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'byteCount'),
            Fields::integer($payload, 'claimAttempts'),
            Fields::integer($payload, 'eventCount'),
            Fields::integer($payload, 'objectId'),
            Fields::string($payload, 'objectUuid'),
            Fields::string($payload, 'processingState'),
            Fields::string($payload, 'windowStart'),
            Fields::optionalString($payload, 'claimExpiresAt'),
            Fields::optionalString($payload, 'failedAt'),
            Fields::optionalString($payload, 'failureClass'),
            Fields::optionalString($payload, 'processedAt'),
        );
    }
}
