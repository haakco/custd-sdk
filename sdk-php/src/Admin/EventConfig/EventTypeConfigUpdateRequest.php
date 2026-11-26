<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EventConfig;

use HaakCo\Custd\Admin\ClientSetup\RollupDimensionProfile;

final readonly class EventTypeConfigUpdateRequest
{
    public function __construct(
        public ?int $retentionDays = null,
        public ?RollupDimensionProfile $rollupDimensions = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->retentionDays !== null) {
            $body['retentionDays'] = $this->retentionDays;
        }
        if ($this->rollupDimensions !== null) {
            $body['rollupDimensions'] = $this->rollupDimensions->serialise();
        }

        return $body;
    }
}
