<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppPlanMeetingSummary
{
    public function __construct(
        public string $meetingUuid,
        public string $name,
        public string $summary,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'meetingUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'summary'),
        );
    }
}
