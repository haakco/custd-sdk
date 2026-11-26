<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** DataSpaceCreateRequest names a new child data space under the broker's tenant. */
final readonly class DataSpaceCreateRequest
{
    public function __construct(
        public string $slug,
        public string $companyName,
    ) {
    }

    /** @return array{slug: string, companyName: string} */
    public function serialise(): array
    {
        return ['slug' => $this->slug, 'companyName' => $this->companyName];
    }
}
