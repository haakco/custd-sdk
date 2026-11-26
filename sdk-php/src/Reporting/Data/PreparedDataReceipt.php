<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class PreparedDataReceipt
{
    /**
     * @param list<Warning> $warnings
     */
    public function __construct(
        public string $availability,
        public NextActionHint $nextAction,
        public string $observedAt,
        public string $processingState,
        public Provenance $provenance,
        public string $receiptUuid,
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
            Fields::string($payload, 'processingState'),
            Provenance::fromPayload(Fields::object($payload, 'provenance')),
            Fields::string($payload, 'receiptUuid'),
            Fields::string($payload, 'retryability'),
            Fields::string($payload, 'tenantSlug'),
            array_map(Warning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
            Fields::optionalString($payload, 'watermark'),
        );
    }
}
