<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class ReportingPackAuditEvent
{
    public function __construct(
        public string $action,
        public string $actorDisplayName,
        public string $createdAt,
        public string $packKey,
        public string $resourceType,
        public ?string $actorReference = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'action'),
            Fields::string($payload, 'actorDisplayName'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'packKey'),
            Fields::string($payload, 'resourceType'),
            Fields::optionalString($payload, 'actorReference'),
        );
    }
}
