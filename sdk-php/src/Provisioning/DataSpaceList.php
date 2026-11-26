<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceList is the parent tenant's data spaces and its entitlement. */
final readonly class DataSpaceList
{
    /** @param list<DataSpace> $dataSpaces */
    public function __construct(
        public array $dataSpaces,
        public DataSpaceEntitlement $entitlement,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DataSpace::fromPayload(...), Fields::objects($payload, 'dataSpaces')),
            DataSpaceEntitlement::fromPayload(Fields::object($payload, 'entitlement')),
        );
    }
}
