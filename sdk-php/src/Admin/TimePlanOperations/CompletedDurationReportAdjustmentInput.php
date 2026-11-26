<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportAdjustmentInput
{
    public function __construct(
        public string $commandId,
        public string $occurredAt,
        public CompletedDurationReportCalculationReceipt $receipt,
        public int $streamVersion,
        public string $transitionUuid,
        public string $type,
        public ?string $actorKind = null,
        public ?string $actorRef = null,
        public ?string $allocatorVersion = null,
        public ?string $clientOccurredAt = null,
        public ?string $currentStatus = null,
        public ?string $previousStatus = null,
        public ?string $reason = null,
        public ?string $schemaVersion = null,
        public ?string $supersedesTransitionId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'command_id'),
            Fields::string($payload, 'occurred_at'),
            CompletedDurationReportCalculationReceipt::fromPayload(Fields::object($payload, 'receipt')),
            Fields::integer($payload, 'stream_version'),
            Fields::string($payload, 'transition_uuid'),
            Fields::string($payload, 'type'),
            Fields::optionalString($payload, 'actor_kind'),
            Fields::optionalString($payload, 'actor_ref'),
            Fields::optionalString($payload, 'allocator_version'),
            Fields::optionalString($payload, 'client_occurred_at'),
            Fields::optionalString($payload, 'current_status'),
            Fields::optionalString($payload, 'previous_status'),
            Fields::optionalString($payload, 'reason'),
            Fields::optionalString($payload, 'schema_version'),
            Fields::optionalString($payload, 'supersedes_transition_id'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'command_id' => $this->commandId,
            'occurred_at' => $this->occurredAt,
            'receipt' => $this->receipt->serialise(),
            'stream_version' => $this->streamVersion,
            'transition_uuid' => $this->transitionUuid,
            'type' => $this->type,
        ];
        if ($this->actorKind !== null) {
            $body['actor_kind'] = $this->actorKind;
        }
        if ($this->actorRef !== null) {
            $body['actor_ref'] = $this->actorRef;
        }
        if ($this->allocatorVersion !== null) {
            $body['allocator_version'] = $this->allocatorVersion;
        }
        if ($this->clientOccurredAt !== null) {
            $body['client_occurred_at'] = $this->clientOccurredAt;
        }
        if ($this->currentStatus !== null) {
            $body['current_status'] = $this->currentStatus;
        }
        if ($this->previousStatus !== null) {
            $body['previous_status'] = $this->previousStatus;
        }
        if ($this->reason !== null) {
            $body['reason'] = $this->reason;
        }
        if ($this->schemaVersion !== null) {
            $body['schema_version'] = $this->schemaVersion;
        }
        if ($this->supersedesTransitionId !== null) {
            $body['supersedes_transition_id'] = $this->supersedesTransitionId;
        }

        return $body;
    }
}
