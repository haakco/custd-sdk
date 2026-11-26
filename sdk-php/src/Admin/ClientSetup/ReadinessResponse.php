<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class ReadinessResponse
{
    /**
     * @param list<ResourceStatus> $resources
     */
    public function __construct(
        public string $manifestDigest,
        public string $observedAt,
        public bool $ready,
        public array $resources,
        public string $safeNextAction,
        public string $safeNextActionCode,
        public string $state,
        public string $tenantSlug,
        public ?OperationStatus $operation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $operation = Fields::optionalObject($payload, 'operation');

        return new self(
            Fields::string($payload, 'manifestDigest'),
            Fields::string($payload, 'observedAt'),
            Fields::boolean($payload, 'ready'),
            array_map(ResourceStatus::fromPayload(...), Fields::objects($payload, 'resources')),
            Fields::string($payload, 'safeNextAction'),
            Fields::string($payload, 'safeNextActionCode'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'tenantSlug'),
            $operation === null ? null : OperationStatus::fromPayload($operation),
        );
    }
}
