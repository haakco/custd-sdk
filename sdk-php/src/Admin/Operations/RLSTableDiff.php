<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSTableDiff
{
    public function __construct(
        public string $classification,
        public bool $drift,
        public string $table,
        public ?RLSPolicySpec $desired = null,
        public ?RLSPolicySpec $live = null,
        public ?string $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $desired = Fields::optionalObject($payload, 'desired');
        $live = Fields::optionalObject($payload, 'live');

        return new self(
            Fields::string($payload, 'classification'),
            Fields::boolean($payload, 'drift'),
            Fields::string($payload, 'table'),
            $desired === null ? null : RLSPolicySpec::fromPayload($desired),
            $live === null ? null : RLSPolicySpec::fromPayload($live),
            Fields::optionalString($payload, 'reason'),
        );
    }
}
