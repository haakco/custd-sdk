<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class QueuedRunFailure
{
    public function __construct(
        public int $attempts,
        public string $error,
        public string $failedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attempts'),
            Fields::string($payload, 'error'),
            Fields::string($payload, 'failedAt'),
        );
    }
}
