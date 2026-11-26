<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSPolicySpec
{
    public function __construct(
        public bool $enabled,
        public bool $force,
        public string $policyName,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'enabled'),
            Fields::boolean($payload, 'force'),
            Fields::string($payload, 'policy_name'),
        );
    }
}
