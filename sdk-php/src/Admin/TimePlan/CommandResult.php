<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CommandResult
{
    public function __construct(
        public string $transitionUuid = "",
        public Run $projection = new Run(),
        public CalculationReceipt $receipt = new CalculationReceipt(),
        public bool $duplicate = false,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "transitionUuid"),
            Run::fromPayload(Payload::object($payload, "projection")),
            CalculationReceipt::fromPayload(Payload::object($payload, "receipt")),
            Payload::boolean($payload, "duplicate"),
        );
    }
}
