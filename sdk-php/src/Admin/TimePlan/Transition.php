<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Transition
{
    public function __construct(
        public string $uuid = "",
        public string $runUuid = "",
        public int $streamVersion = 0,
        public string $commandId = "",
        public string $type = "",
        public string $actorKind = "",
        public string $actorRef = "",
        public string $serverReceivedAt = "",
        public ?string $clientOccurredAt = null,
        public string $reason = "",
        public string $previousStatus = "",
        public string $currentStatus = "",
        public string $allocatorVersion = "",
        public string $schemaVersion = "",
        public string $supersedesTransitionUuid = "",
        public CalculationReceipt $receipt = new CalculationReceipt(),
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "runUuid"),
            Payload::integer($payload, "streamVersion"),
            Payload::string($payload, "commandId"),
            Payload::string($payload, "type"),
            Payload::string($payload, "actorKind"),
            Payload::string($payload, "actorRef"),
            Payload::string($payload, "serverReceivedAt"),
            Payload::optionalString($payload, "clientOccurredAt"),
            Payload::optionalString($payload, "reason") ?? "",
            Payload::optionalString($payload, "previousStatus") ?? "",
            Payload::string($payload, "currentStatus"),
            Payload::string($payload, "allocatorVersion"),
            Payload::string($payload, "schemaVersion"),
            Payload::optionalString($payload, "supersedesTransitionUuid") ?? "",
            CalculationReceipt::fromPayload(Payload::object($payload, "receipt")),
        );
    }
}
