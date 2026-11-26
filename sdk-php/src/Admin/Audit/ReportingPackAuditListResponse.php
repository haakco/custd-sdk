<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class ReportingPackAuditListResponse
{
    /**
     * @param list<ReportingPackAuditEvent> $events
     */
    public function __construct(
        public array $events,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ReportingPackAuditEvent::fromPayload(...), Fields::objects($payload, 'events')),
        );
    }
}
