<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class RevisionRequest implements Dto
{
    public function __construct(public int $expectedRevision)
    {
        if ($expectedRevision <= 0) {
            throw new \InvalidArgumentException("custd: expectedRevision must be positive");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["expectedRevision" => $this->expectedRevision];
    }
}
