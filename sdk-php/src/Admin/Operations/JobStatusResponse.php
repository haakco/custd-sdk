<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class JobStatusResponse
{
    /**
     * @param list<OutboxStatus> $outboxes
     * @param list<QueueCount> $queueCounts
     * @param list<FailedJob> $recentFailures
     */
    public function __construct(
        public array $outboxes,
        public array $queueCounts,
        public int $realtimeEvents,
        public array $recentFailures,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(OutboxStatus::fromPayload(...), Fields::objects($payload, 'outboxes')),
            array_map(QueueCount::fromPayload(...), Fields::objects($payload, 'queueCounts')),
            Fields::integer($payload, 'realtimeEvents'),
            array_map(FailedJob::fromPayload(...), Fields::objects($payload, 'recentFailures')),
        );
    }
}
