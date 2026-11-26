<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceUsage is the parent tenant's retained storage across its data spaces, with one row per data space. */
final readonly class DataSpaceUsage
{
    /** @param list<DataSpaceUsageRow> $dataSpaces */
    public function __construct(
        public string $parentCompanySlug,
        public int $retainedLogicalBytes,
        public int $retainedEventCount,
        public string $measuredAt,
        public StorageMeasurementState $measurementState,
        public int $dataSpaceCount,
        public array $dataSpaces,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'parentCompanySlug'),
            Fields::integer($payload, 'retainedLogicalBytes'),
            Fields::integer($payload, 'retainedEventCount'),
            Fields::string($payload, 'measuredAt'),
            StorageMeasurementState::fromPayload(Fields::object($payload, 'measurementState')),
            Fields::integer($payload, 'dataSpaceCount'),
            array_map(DataSpaceUsageRow::fromPayload(...), Fields::objects($payload, 'dataSpaces')),
        );
    }
}
