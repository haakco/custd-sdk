<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class FailedJob
{
    public function __construct(
        public int $attempts,
        public string $failedAt,
        public int $jobId,
        public string $kind,
        public int $maxAttempts,
        public string $queue,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'attempts'),
            Fields::string($payload, 'failedAt'),
            Fields::integer($payload, 'jobId'),
            Fields::string($payload, 'kind'),
            Fields::integer($payload, 'maxAttempts'),
            Fields::string($payload, 'queue'),
        );
    }
}
