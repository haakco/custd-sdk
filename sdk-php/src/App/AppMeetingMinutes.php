<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingMinutes
{
    /**
     * @param list<AppMeetingAction> $actions
     */
    public function __construct(
        public array $actions,
        public string $decisions,
        public string $minutes,
        public ?string $planUuid = null,
        public ?string $sharedSummary = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppMeetingAction::fromPayload(...), Fields::objects($payload, 'actions')),
            Fields::string($payload, 'decisions'),
            Fields::string($payload, 'minutes'),
            Fields::optionalString($payload, 'planUuid'),
            Fields::optionalString($payload, 'sharedSummary'),
        );
    }
}
