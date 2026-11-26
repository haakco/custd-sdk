<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionRunsListResponse
{
    /**
     * @param list<RetentionRunRecord> $runs
     */
    public function __construct(
        public bool $hasMore,
        public int $nextOffset,
        public array $runs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'hasMore'),
            Fields::integer($payload, 'nextOffset'),
            array_map(RetentionRunRecord::fromPayload(...), Fields::objects($payload, 'runs')),
        );
    }
}
