<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingAllocationChange
{
    public function __construct(public string $blockUuid, public int $beforeMs, public int $afterMs)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'blockUuid'),
            Fields::integer($payload, 'beforeMs'),
            Fields::integer($payload, 'afterMs'),
        );
    }
}
