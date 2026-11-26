<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditListResponse
{
    /**
     * @param list<AuditEvent> $events
     */
    public function __construct(
        public array $events,
        public AuditListCursor $nextCursor,
        public ?string $coverageBeginsAt = null,
        public ?AuditRetentionDisclosure $retention = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $retention = Fields::optionalObject($payload, 'retention');

        return new self(
            array_map(AuditEvent::fromPayload(...), Fields::objects($payload, 'events')),
            AuditListCursor::fromPayload(Fields::object($payload, 'nextCursor')),
            Fields::optionalString($payload, 'coverageBeginsAt'),
            $retention === null ? null : AuditRetentionDisclosure::fromPayload($retention),
        );
    }
}
