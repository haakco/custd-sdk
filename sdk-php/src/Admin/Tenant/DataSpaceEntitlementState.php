<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

use HaakCo\Custd\Fields;

final readonly class DataSpaceEntitlementState
{
    public function __construct(
        public int $activeDataSpaces,
        public bool $enabled,
        public int $maxActiveDataSpaces,
        public int $maxActiveProducersPerDataSpace,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'activeDataSpaces'),
            Fields::boolean($payload, 'enabled'),
            Fields::integer($payload, 'maxActiveDataSpaces'),
            Fields::integer($payload, 'maxActiveProducersPerDataSpace'),
        );
    }
}
