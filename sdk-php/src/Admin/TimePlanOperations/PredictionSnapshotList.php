<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class PredictionSnapshotList
{
    /**
     * @param list<PredictionSnapshot> $snapshots
     */
    public function __construct(
        public array $snapshots,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PredictionSnapshot::fromPayload(...), Fields::objects($payload, 'snapshots')),
        );
    }
}
