<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class DurationObservationReadResponse
{
    /**
     * @param list<DurationObservationIdentity> $observations
     */
    public function __construct(
        public int $nonDeletedCount,
        public array $observations,
        public string $runUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'nonDeletedCount'),
            array_map(DurationObservationIdentity::fromPayload(...), Fields::objects($payload, 'observations')),
            Fields::string($payload, 'runUuid'),
        );
    }
}
