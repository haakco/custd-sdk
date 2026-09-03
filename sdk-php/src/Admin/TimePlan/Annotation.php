<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class Annotation
{
    public function __construct(
        public string $uuid = "",
        public string $runUuid = "",
        public string $runBlockUuid = "",
        public string $type = "",
        public string $text = "",
        public string $markerLabel = "",
        public string $decisionStatus = "",
        public string $assigneeRef = "",
        public ?string $dueDate = null,
        public string $actionStatus = "",
        public string $supersedesUuid = "",
        public string $recordedAt = "",
        public string $actorKind = "",
        public string $actorRef = "",
        public ?string $redactedAt = null,
        public string $redactionReason = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::string($payload, "uuid"),
            Payload::string($payload, "runUuid"),
            Payload::optionalString($payload, "runBlockUuid") ?? "",
            Payload::string($payload, "type"),
            Payload::optionalString($payload, "text") ?? "",
            Payload::optionalString($payload, "markerLabel") ?? "",
            Payload::optionalString($payload, "decisionStatus") ?? "",
            Payload::optionalString($payload, "assigneeRef") ?? "",
            Payload::optionalString($payload, "dueDate"),
            Payload::optionalString($payload, "actionStatus") ?? "",
            Payload::optionalString($payload, "supersedesUuid") ?? "",
            Payload::string($payload, "recordedAt"),
            Payload::string($payload, "actorKind"),
            Payload::string($payload, "actorRef"),
            Payload::optionalString($payload, "redactedAt"),
            Payload::optionalString($payload, "redactionReason") ?? "",
        );
    }
}
