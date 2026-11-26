<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class OperationRetryFailure
{
    /**
     * @param list<ResourceStatus> $resources
     */
    public function __construct(
        public string $code,
        public string $observedAt,
        public array $resources,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'code'),
            Fields::string($payload, 'observedAt'),
            array_map(ResourceStatus::fromPayload(...), Fields::objects($payload, 'resources')),
        );
    }
}
