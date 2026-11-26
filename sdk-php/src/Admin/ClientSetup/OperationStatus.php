<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class OperationStatus
{
    public function __construct(
        public int $attemptCount,
        public string $createdAt,
        public string $idempotencyKey,
        public string $state,
        public string $updatedAt,
        public string $uuid,
        public ?string $completedAt = null,
        public ?string $errorCode = null,
        public ?string $leaseExpiresAt = null,
        public ?OperationPendingStatus $pending = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $pending = Fields::optionalObject($payload, 'pending');

        return new self(
            Fields::integer($payload, 'attemptCount'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'idempotencyKey'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'errorCode'),
            Fields::optionalString($payload, 'leaseExpiresAt'),
            $pending === null ? null : OperationPendingStatus::fromPayload($pending),
        );
    }
}
