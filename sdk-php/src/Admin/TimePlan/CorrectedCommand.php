<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CorrectedCommand implements Dto
{
    public function __construct(
        public string $type,
        public string $effectiveAt,
        public string $blockId = "",
        public ?string $boundaryEndsAt = null,
        public string $startPolicy = "",
    ) {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "type" => $this->type, "effectiveAt" => $this->effectiveAt,
            "blockId" => $this->blockId, "boundaryEndsAt" => $this->boundaryEndsAt,
            "startPolicy" => $this->startPolicy,
        ]);
    }
}
