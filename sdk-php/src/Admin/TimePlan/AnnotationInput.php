<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class AnnotationInput implements Dto
{
    public function __construct(
        public string $type,
        public string $runBlockUuid = "",
        public string $text = "",
        public string $markerLabel = "",
        public string $decisionStatus = "",
        public string $assigneeRef = "",
        public ?string $dueDate = null,
        public string $actionStatus = "",
    ) {
        if (trim($type) === "") {
            throw new \InvalidArgumentException("custd: annotation type is required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "type" => $this->type, "runBlockUuid" => $this->runBlockUuid,
            "text" => $this->text, "markerLabel" => $this->markerLabel,
            "decisionStatus" => $this->decisionStatus, "assigneeRef" => $this->assigneeRef,
            "dueDate" => $this->dueDate, "actionStatus" => $this->actionStatus,
        ]);
    }
}
