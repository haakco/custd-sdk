<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Version
{
    public function __construct(
        public string $uuid = "",
        public string $planUuid = "",
        public int $versionNumber = 0,
        public string $definitionHash = "",
        public string $publishedAt = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "planUuid"),
            Payload::integer($payload, "versionNumber"),
            Payload::string($payload, "definitionHash"),
            Payload::string($payload, "publishedAt"),
        );
    }
}
