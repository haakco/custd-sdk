<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class OffboardingScheduleListResponse
{
    /**
     * @param list<OffboardingSchedule> $schedules
     */
    public function __construct(
        public array $schedules,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(OffboardingSchedule::fromPayload(...), Fields::objects($payload, 'schedules')),
        );
    }
}
