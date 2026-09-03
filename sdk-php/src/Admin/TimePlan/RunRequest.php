<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class RunRequest implements Dto
{
    public function __construct(
        public string $planUuid,
        public ?string $versionUuid = null,
        public ?string $scheduledStartsAt = null,
        public ?string $scheduledEndsAt = null,
    ) {
        if (trim($planUuid) === "") {
            throw new \InvalidArgumentException("custd: planUuid is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "planUuid" => $this->planUuid, "versionUuid" => $this->versionUuid,
            "scheduledStartsAt" => $this->scheduledStartsAt, "scheduledEndsAt" => $this->scheduledEndsAt,
        ]);
    }
}
