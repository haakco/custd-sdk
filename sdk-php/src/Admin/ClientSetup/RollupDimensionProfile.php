<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class RollupDimensionProfile
{
    /**
     * @param list<EventRollupDimension>|null $dimensions
     */
    public function __construct(
        public ?array $dimensions = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->dimensions !== null) {
            $body['dimensions'] = array_map(static fn (EventRollupDimension $item): array => $item->serialise(), $this->dimensions);
        }

        return $body;
    }
}
