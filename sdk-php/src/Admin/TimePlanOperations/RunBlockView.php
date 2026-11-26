<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class RunBlockView
{
    public function __construct(
        public int $actualActiveMs,
        public int $baselineMs,
        public int $currentMs,
        public bool $outcomeCensored,
        public int $sequence,
        public string $status,
        public string $uuid,
        public ?int $allocatedAtStartMs = null,
        public ?string $wallEndedAt = null,
        public ?string $wallStartedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'actualActiveMs'),
            Fields::integer($payload, 'baselineMs'),
            Fields::integer($payload, 'currentMs'),
            Fields::boolean($payload, 'outcomeCensored'),
            Fields::integer($payload, 'sequence'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'uuid'),
            Fields::optionalInteger($payload, 'allocatedAtStartMs'),
            Fields::optionalString($payload, 'wallEndedAt'),
            Fields::optionalString($payload, 'wallStartedAt'),
        );
    }
}
