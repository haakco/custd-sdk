<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

final readonly class DataSpaceEntitlementUpdateRequest
{
    public function __construct(
        public bool $enabled,
        public int $maxActiveDataSpaces,
        public int $maxActiveProducersPerDataSpace,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabled' => $this->enabled,
            'maxActiveDataSpaces' => $this->maxActiveDataSpaces,
            'maxActiveProducersPerDataSpace' => $this->maxActiveProducersPerDataSpace,
        ];

        return $body;
    }
}
