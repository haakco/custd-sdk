<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportAllocation
{
    public function __construct(
        public string $blockUuid,
        public int $durationMs,
        public int $sequence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'block_uuid'),
            Fields::integer($payload, 'duration_ms'),
            Fields::integer($payload, 'sequence'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'block_uuid' => $this->blockUuid,
            'duration_ms' => $this->durationMs,
            'sequence' => $this->sequence,
        ];

        return $body;
    }
}
