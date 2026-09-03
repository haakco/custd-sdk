<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CalculationChange
{
    public function __construct(public string $blockId = "", public int $fromMs = 0, public int $toMs = 0)
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(Payload::string($payload, "blockId"), Payload::integer($payload, "fromMs"), Payload::integer($payload, "toMs"));
    }
}
