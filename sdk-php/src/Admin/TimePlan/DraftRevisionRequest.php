<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class DraftRevisionRequest implements Dto
{
    public function __construct(
        public int $expectedRevision,
        public string $planKey,
        public string $name,
        public Definition $definition,
        public string $description = "",
    ) {
        if ($expectedRevision <= 0 || trim($planKey) === "" || trim($name) === "") {
            throw new \InvalidArgumentException("custd: time-plan revision request is invalid");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "expectedRevision" => $this->expectedRevision, "planKey" => $this->planKey,
            "name" => $this->name, "description" => $this->description,
            "definition" => $this->definition->toPayload(),
        ];
    }
}
