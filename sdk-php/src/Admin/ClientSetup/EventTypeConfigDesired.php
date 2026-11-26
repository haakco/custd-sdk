<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class EventTypeConfigDesired
{
    public function __construct(
        public string $eventTypeSlug,
        public RollupDimensionProfile $rollupDimensions,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'eventTypeSlug' => $this->eventTypeSlug,
            'rollupDimensions' => $this->rollupDimensions->serialise(),
        ];

        return $body;
    }
}
