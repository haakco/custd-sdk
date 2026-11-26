<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class OperationPendingStatus
{
    public function __construct(
        public string $nextAttemptAt,
        public ?OperationRetryFailure $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $lastFailure = Fields::optionalObject($payload, 'lastFailure');

        return new self(
            Fields::string($payload, 'nextAttemptAt'),
            $lastFailure === null ? null : OperationRetryFailure::fromPayload($lastFailure),
        );
    }
}
