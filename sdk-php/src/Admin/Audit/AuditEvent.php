<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditEvent
{
    /**
     * @param list<string> $actorRoles
     * @param list<AuditChange> $changes
     */
    public function __construct(
        public string $action,
        public string $actorDisplayName,
        public string $actorKind,
        public string $createdAt,
        public string $eventId,
        public string $outcome,
        public string $resourceType,
        public string $tenantSlug,
        public ?string $actorReference = null,
        public array $actorRoles = [],
        public array $changes = [],
        public ?string $correlationId = null,
        public mixed $details = null,
        public ?AuditDomainHistory $domainHistory = null,
        public ?AuditNetworkDisclosure $network = null,
        public ?string $operationId = null,
        public ?string $resourceId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $domainHistory = Fields::optionalObject($payload, 'domainHistory');
        $network = Fields::optionalObject($payload, 'network');

        return new self(
            Fields::string($payload, 'action'),
            Fields::string($payload, 'actorDisplayName'),
            Fields::string($payload, 'actorKind'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'eventId'),
            Fields::string($payload, 'outcome'),
            Fields::string($payload, 'resourceType'),
            Fields::string($payload, 'tenantSlug'),
            Fields::optionalString($payload, 'actorReference'),
            Fields::optionalStrings($payload, 'actorRoles') ?? [],
            array_map(AuditChange::fromPayload(...), Fields::optionalObjects($payload, 'changes') ?? []),
            Fields::optionalString($payload, 'correlationId'),
            Fields::raw($payload, 'details'),
            $domainHistory === null ? null : AuditDomainHistory::fromPayload($domainHistory),
            $network === null ? null : AuditNetworkDisclosure::fromPayload($network),
            Fields::optionalString($payload, 'operationId'),
            Fields::optionalString($payload, 'resourceId'),
        );
    }
}
