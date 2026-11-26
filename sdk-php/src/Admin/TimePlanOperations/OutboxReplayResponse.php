<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class OutboxReplayResponse
{
    public function __construct(
        public string $replayedAt,
        public int $requested,
        public int $requeued,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'replayedAt'),
            Fields::integer($payload, 'requested'),
            Fields::integer($payload, 'requeued'),
        );
    }
}
