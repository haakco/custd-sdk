<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceUsageRow is one data space's retained storage. revokedAt is set once the data space is revoked. */
final readonly class DataSpaceUsageRow
{
    public function __construct(
        public string $slug,
        public string $companyName,
        public bool $enabled,
        public string $measuredAt,
        public int $retainedLogicalBytes,
        public int $retainedEventCount,
        public StorageMeasurementState $measurementState,
        public ?string $revokedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'slug'),
            Fields::string($payload, 'companyName'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'measuredAt'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::integer($payload, 'retainedEventCount'),
            StorageMeasurementState::fromPayload(Fields::object($payload, 'measurementState')),
            Fields::optionalString($payload, 'revokedAt'),
        );
    }
}
