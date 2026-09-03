<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class CommandRequest implements Dto
{
    public function __construct(
        public string $commandId,
        public string $idempotencyKey,
        public int $expectedVersion,
        public string $type,
        public string $blockId = "",
        public ?string $clientOccurredAt = null,
        public ?string $boundaryEndsAt = null,
        public ?string $scheduledStartsAt = null,
        public ?string $scheduledEndsAt = null,
        public string $startPolicy = "",
        public string $reason = "",
        public ?int $supersedesTransitionId = null,
        public ?CorrectedCommand $corrected = null,
    ) {
        if (trim($commandId) === "" || trim($idempotencyKey) === "" || trim($type) === "") {
            throw new \InvalidArgumentException("custd: commandId, idempotencyKey, and type are required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "commandId" => $this->commandId, "idempotencyKey" => $this->idempotencyKey,
            "expectedVersion" => $this->expectedVersion, "type" => $this->type,
            "blockId" => $this->blockId, "clientOccurredAt" => $this->clientOccurredAt,
            "boundaryEndsAt" => $this->boundaryEndsAt, "scheduledStartsAt" => $this->scheduledStartsAt,
            "scheduledEndsAt" => $this->scheduledEndsAt, "startPolicy" => $this->startPolicy,
            "reason" => $this->reason, "supersedesTransitionId" => $this->supersedesTransitionId,
            "corrected" => $this->corrected?->toPayload(),
        ]);
    }
}
