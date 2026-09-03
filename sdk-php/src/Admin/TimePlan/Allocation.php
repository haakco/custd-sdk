<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Allocation implements Dto
{
    public function __construct(public string $blockId = "", public int $sequence = 0, public int $durationMs = 0)
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "blockId"),
            Payload::integer($payload, "sequence"),
            Payload::integer($payload, "durationMs"),
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["blockId" => $this->blockId, "sequence" => $this->sequence, "durationMs" => $this->durationMs];
    }
}
