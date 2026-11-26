<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMeetingBlock
{
    public function __construct(
        public int $actualMs,
        public int $allocatedMs,
        public string $blockUuid,
        public int $position,
        public int $predictedMs,
        public string $status,
        public string $title,
        public ?string $endedAt = null,
        public ?string $startedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'actualMs'),
            Fields::integer($payload, 'allocatedMs'),
            Fields::string($payload, 'blockUuid'),
            Fields::integer($payload, 'position'),
            Fields::integer($payload, 'predictedMs'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'title'),
            Fields::optionalString($payload, 'endedAt'),
            Fields::optionalString($payload, 'startedAt'),
        );
    }
}
