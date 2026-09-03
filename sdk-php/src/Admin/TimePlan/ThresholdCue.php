<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class ThresholdCue implements Dto
{
    public function __construct(
        public ?int $remainingFractionBps = null,
        public ?int $remainingMs = null,
        public string $severity = "",
    ) {
        if (!in_array($severity, ["info", "warning", "critical"], true)) {
            throw new \InvalidArgumentException("custd: time-plan threshold cue severity is invalid");
        }
        if (($remainingFractionBps === null) === ($remainingMs === null)) {
            throw new \InvalidArgumentException("custd: time-plan threshold cue must have one remaining threshold");
        }
        if ($remainingFractionBps !== null && ($remainingFractionBps < 0 || $remainingFractionBps > 10000)) {
            throw new \InvalidArgumentException("custd: time-plan remainingFractionBps is out of range");
        }
        if ($remainingMs !== null && ($remainingMs < 0 || $remainingMs > 2419200000)) {
            throw new \InvalidArgumentException("custd: time-plan remainingMs is out of range");
        }
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::optionalInteger($payload, "remainingFractionBps"),
            Payload::optionalInteger($payload, "remainingMs"),
            Payload::string($payload, "severity"),
        );
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "remainingFractionBps" => $this->remainingFractionBps,
            "remainingMs" => $this->remainingMs,
            "severity" => $this->severity,
        ]);
    }
}
