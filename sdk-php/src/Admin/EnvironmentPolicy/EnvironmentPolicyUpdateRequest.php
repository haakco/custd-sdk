<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EnvironmentPolicy;

final readonly class EnvironmentPolicyUpdateRequest
{
    public function __construct(
        public ?bool $autoCreateEnvironments = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->autoCreateEnvironments !== null) {
            $body['autoCreateEnvironments'] = $this->autoCreateEnvironments;
        }

        return $body;
    }
}
