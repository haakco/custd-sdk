<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class QueueCount
{
    public function __construct(
        public int $count,
        public string $kind,
        public string $queue,
        public string $state,
        public ?string $oldestWaitingAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'queue'),
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'oldestWaitingAt'),
        );
    }
}
