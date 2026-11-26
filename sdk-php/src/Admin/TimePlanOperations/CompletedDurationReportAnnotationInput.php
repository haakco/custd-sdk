<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportAnnotationInput
{
    public function __construct(
        public string $actorKind,
        public string $recordedAt,
        public string $type,
        public string $uuid,
        public ?string $actionStatus = null,
        public ?string $actorRef = null,
        public ?string $assigneeRef = null,
        public ?string $blockUuid = null,
        public ?string $decisionStatus = null,
        public ?string $dueDate = null,
        public ?string $markerLabel = null,
        public ?string $redactedAt = null,
        public ?string $supersedesUuid = null,
        public ?string $text = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'actor_kind'),
            Fields::string($payload, 'recorded_at'),
            Fields::string($payload, 'type'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'action_status'),
            Fields::optionalString($payload, 'actor_ref'),
            Fields::optionalString($payload, 'assignee_ref'),
            Fields::optionalString($payload, 'block_uuid'),
            Fields::optionalString($payload, 'decision_status'),
            Fields::optionalString($payload, 'due_date'),
            Fields::optionalString($payload, 'marker_label'),
            Fields::optionalString($payload, 'redacted_at'),
            Fields::optionalString($payload, 'supersedes_uuid'),
            Fields::optionalString($payload, 'text'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'actor_kind' => $this->actorKind,
            'recorded_at' => $this->recordedAt,
            'type' => $this->type,
            'uuid' => $this->uuid,
        ];
        if ($this->actionStatus !== null) {
            $body['action_status'] = $this->actionStatus;
        }
        if ($this->actorRef !== null) {
            $body['actor_ref'] = $this->actorRef;
        }
        if ($this->assigneeRef !== null) {
            $body['assignee_ref'] = $this->assigneeRef;
        }
        if ($this->blockUuid !== null) {
            $body['block_uuid'] = $this->blockUuid;
        }
        if ($this->decisionStatus !== null) {
            $body['decision_status'] = $this->decisionStatus;
        }
        if ($this->dueDate !== null) {
            $body['due_date'] = $this->dueDate;
        }
        if ($this->markerLabel !== null) {
            $body['marker_label'] = $this->markerLabel;
        }
        if ($this->redactedAt !== null) {
            $body['redacted_at'] = $this->redactedAt;
        }
        if ($this->supersedesUuid !== null) {
            $body['supersedes_uuid'] = $this->supersedesUuid;
        }
        if ($this->text !== null) {
            $body['text'] = $this->text;
        }

        return $body;
    }
}
