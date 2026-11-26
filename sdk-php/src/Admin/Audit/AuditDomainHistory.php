<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditDomainHistory
{
    public function __construct(
        public string $createdAt,
        public string $source,
        public string $sourceId,
        public ?string $action = null,
        public ?string $currentState = null,
        public ?string $previousState = null,
        public ?string $resourceId = null,
        public ?string $resourceType = null,
        public ?string $state = null,
        public ?int $streamVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'sourceId'),
            Fields::optionalString($payload, 'action'),
            Fields::optionalString($payload, 'currentState'),
            Fields::optionalString($payload, 'previousState'),
            Fields::optionalString($payload, 'resourceId'),
            Fields::optionalString($payload, 'resourceType'),
            Fields::optionalString($payload, 'state'),
            Fields::optionalInteger($payload, 'streamVersion'),
        );
    }
}
