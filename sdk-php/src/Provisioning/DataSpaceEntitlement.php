<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceEntitlement is how many data spaces, and producers in each, the parent tenant may hold. */
final readonly class DataSpaceEntitlement
{
    public function __construct(
        public bool $enabled,
        public int $activeDataSpaces,
        public int $maxActiveDataSpaces,
        public int $maxActiveProducersPerDataSpace,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'enabled'),
            Fields::integer($payload, 'activeDataSpaces'),
            Fields::integer($payload, 'maxActiveDataSpaces'),
            Fields::integer($payload, 'maxActiveProducersPerDataSpace'),
        );
    }
}
