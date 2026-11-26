<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSPolicyDiff
{
    /**
     * @param list<string> $drift
     */
    public function __construct(
        public bool $converged,
        public RLSPolicySpec $desired,
        public RLSPolicySpec $live,
        public string $table,
        public array $drift = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'converged'),
            RLSPolicySpec::fromPayload(Fields::object($payload, 'desired')),
            RLSPolicySpec::fromPayload(Fields::object($payload, 'live')),
            Fields::string($payload, 'table'),
            Fields::optionalStrings($payload, 'drift') ?? [],
        );
    }
}
