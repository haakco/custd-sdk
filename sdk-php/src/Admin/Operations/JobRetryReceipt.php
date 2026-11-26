<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class JobRetryReceipt
{
    public function __construct(
        public int $jobId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'jobId'),
        );
    }
}
