<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Plan
{
    public function __construct(
        public string $uuid = "",
        public string $planKey = "",
        public string $name = "",
        public string $description = "",
        public string $status = "",
        public int $draftRevision = 0,
        public Definition $definition = new Definition(),
        public string $updatedAt = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "planKey"),
            Payload::string($payload, "name"),
            Payload::string($payload, "description"),
            Payload::string($payload, "status"),
            Payload::integer($payload, "draftRevision"),
            Definition::fromPayload(Payload::object($payload, "definition")),
            Payload::string($payload, "updatedAt"),
        );
    }
}
