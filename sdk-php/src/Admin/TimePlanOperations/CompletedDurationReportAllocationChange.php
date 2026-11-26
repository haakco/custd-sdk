<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportAllocationChange
{
    public function __construct(
        public string $blockUuid,
        public int $fromMs,
        public int $toMs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'block_uuid'),
            Fields::integer($payload, 'from_ms'),
            Fields::integer($payload, 'to_ms'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'block_uuid' => $this->blockUuid,
            'from_ms' => $this->fromMs,
            'to_ms' => $this->toMs,
        ];

        return $body;
    }
}
