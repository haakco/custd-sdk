<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportBlockInput
{
    /**
     * @param list<string>|null $tags
     * @param CompletedDurationBlockOutcome::* $outcome
     * @param CompletedDurationBlockStatus::* $status
     */
    public function __construct(
        public string $blockUuid,
        public int $currentMs,
        public string $outcome,
        public int $plannedMs,
        public string $semanticKey,
        public int $sequence,
        public string $status,
        public ?int $actualMs = null,
        public ?int $allocatedAtStartMs = null,
        public ?string $category = null,
        public ?array $tags = null,
        public ?string $wallEndedAt = null,
        public ?string $wallStartedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'block_uuid'),
            Fields::integer($payload, 'current_ms'),
            Fields::string($payload, 'outcome'),
            Fields::integer($payload, 'planned_ms'),
            Fields::string($payload, 'semantic_key'),
            Fields::integer($payload, 'sequence'),
            Fields::string($payload, 'status'),
            Fields::optionalInteger($payload, 'actual_ms'),
            Fields::optionalInteger($payload, 'allocated_at_start_ms'),
            Fields::optionalString($payload, 'category'),
            Fields::optionalStrings($payload, 'tags') ?? [],
            Fields::optionalString($payload, 'wall_ended_at'),
            Fields::optionalString($payload, 'wall_started_at'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'block_uuid' => $this->blockUuid,
            'current_ms' => $this->currentMs,
            'outcome' => $this->outcome,
            'planned_ms' => $this->plannedMs,
            'semantic_key' => $this->semanticKey,
            'sequence' => $this->sequence,
            'status' => $this->status,
        ];
        if ($this->actualMs !== null) {
            $body['actual_ms'] = $this->actualMs;
        }
        if ($this->allocatedAtStartMs !== null) {
            $body['allocated_at_start_ms'] = $this->allocatedAtStartMs;
        }
        if ($this->category !== null) {
            $body['category'] = $this->category;
        }
        if ($this->tags !== null) {
            $body['tags'] = $this->tags;
        }
        if ($this->wallEndedAt !== null) {
            $body['wall_ended_at'] = $this->wallEndedAt;
        }
        if ($this->wallStartedAt !== null) {
            $body['wall_started_at'] = $this->wallStartedAt;
        }

        return $body;
    }
}
