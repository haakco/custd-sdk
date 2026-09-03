<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class DraftRequest implements Dto
{
    public function __construct(
        public string $planKey,
        public string $name,
        public Definition $definition,
        public string $description = "",
    ) {
        if (trim($planKey) === "" || trim($name) === "") {
            throw new \InvalidArgumentException("custd: time-plan planKey and name are required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "planKey" => $this->planKey, "name" => $this->name,
            "description" => $this->description, "definition" => $this->definition->toPayload(),
        ];
    }
}
