<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingSummary
{
    public function __construct(
        public int $finishedActualMs,
        public int $finishedBlocks,
        public int $finishedPredictedMs,
        public int $overrunMs,
        public int $predictedMs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'finishedActualMs'),
            Fields::integer($payload, 'finishedBlocks'),
            Fields::integer($payload, 'finishedPredictedMs'),
            Fields::integer($payload, 'overrunMs'),
            Fields::integer($payload, 'predictedMs'),
        );
    }
}
