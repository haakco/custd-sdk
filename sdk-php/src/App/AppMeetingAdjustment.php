<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingAdjustment
{
    /** @param list<AppMeetingAllocationChange> $changes */
    public function __construct(public string $blockUuid, public array $changes)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'blockUuid'),
            array_map(AppMeetingAllocationChange::fromPayload(...), Fields::objects($payload, 'changes')),
        );
    }
}
