<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class BootstrapStatus
{
    /**
     * @param list<Warning> $warnings
     */
    public function __construct(
        public NextActionHint $nextAction,
        public string $observedAt,
        public Provenance $provenance,
        public string $retryability,
        public string $state,
        public string $tenantSlug,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            NextActionHint::fromPayload(Fields::object($payload, 'nextAction')),
            Fields::string($payload, 'observedAt'),
            Provenance::fromPayload(Fields::object($payload, 'provenance')),
            Fields::string($payload, 'retryability'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'tenantSlug'),
            array_map(Warning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
        );
    }
}
