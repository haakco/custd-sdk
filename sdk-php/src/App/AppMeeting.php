<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeeting
{
    /**
     * @param list<AppMeetingBlock> $blocks
     * @param list<AppMeetingAdjustment> $adjustments
     * @param AppMeetingStatus::* $status
     */
    public function __construct(
        public array $blocks,
        public string $name,
        public string $status,
        public AppMeetingSummary $summary,
        public ?string $currentBlockUuid = null,
        public ?string $endsAt = null,
        public ?string $startedAt = null,
        public array $adjustments = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppMeetingBlock::fromPayload(...), Fields::objects($payload, 'blocks')),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'status'),
            AppMeetingSummary::fromPayload(Fields::object($payload, 'summary')),
            Fields::optionalString($payload, 'currentBlockUuid'),
            Fields::optionalString($payload, 'endsAt'),
            Fields::optionalString($payload, 'startedAt'),
            isset($payload->adjustments) ? array_map(AppMeetingAdjustment::fromPayload(...), Fields::objects($payload, 'adjustments')) : [],
        );
    }
}
