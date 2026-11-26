<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Retryability;

final readonly class PreparedDataOutput
{
    /**
     * @param list<Warning> $warnings
     * @param Retryability::* $retryability
     * @param PreparedDataAvailability::* $availability
     * @param PreparedDataState::* $processingState
     */
    public function __construct(
        public string $availability,
        public NextActionHint $nextAction,
        public string $observedAt,
        public string $outputUuid,
        public string $processingState,
        public Provenance $provenance,
        public string $retryability,
        public string $tenantSlug,
        public array $warnings = [],
        public ?string $watermark = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'availability'),
            NextActionHint::fromPayload(Fields::object($payload, 'nextAction')),
            Fields::string($payload, 'observedAt'),
            Fields::string($payload, 'outputUuid'),
            Fields::string($payload, 'processingState'),
            Provenance::fromPayload(Fields::object($payload, 'provenance')),
            Fields::string($payload, 'retryability'),
            Fields::string($payload, 'tenantSlug'),
            array_map(Warning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
            Fields::optionalString($payload, 'watermark'),
        );
    }
}
