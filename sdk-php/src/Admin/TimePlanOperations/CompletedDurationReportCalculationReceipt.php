<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportCalculationReceipt
{
    /**
     * @param list<CompletedDurationReportAllocationChange>|null $changes
     * @param list<CompletedDurationReportAllocation>|null $result
     * @param list<CompletedDurationReportAllocation>|null $source
     */
    public function __construct(
        public ?string $allocatorVersion = null,
        public ?array $changes = null,
        public ?string $reason = null,
        public ?array $result = null,
        public ?array $source = null,
        public ?string $summary = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'allocator_version'),
            array_map(CompletedDurationReportAllocationChange::fromPayload(...), Fields::optionalObjects($payload, 'changes') ?? []),
            Fields::optionalString($payload, 'reason'),
            array_map(CompletedDurationReportAllocation::fromPayload(...), Fields::optionalObjects($payload, 'result') ?? []),
            array_map(CompletedDurationReportAllocation::fromPayload(...), Fields::optionalObjects($payload, 'source') ?? []),
            Fields::optionalString($payload, 'summary'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->allocatorVersion !== null) {
            $body['allocator_version'] = $this->allocatorVersion;
        }
        if ($this->changes !== null) {
            $body['changes'] = array_map(static fn (CompletedDurationReportAllocationChange $item): array => $item->serialise(), $this->changes);
        }
        if ($this->reason !== null) {
            $body['reason'] = $this->reason;
        }
        if ($this->result !== null) {
            $body['result'] = array_map(static fn (CompletedDurationReportAllocation $item): array => $item->serialise(), $this->result);
        }
        if ($this->source !== null) {
            $body['source'] = array_map(static fn (CompletedDurationReportAllocation $item): array => $item->serialise(), $this->source);
        }
        if ($this->summary !== null) {
            $body['summary'] = $this->summary;
        }

        return $body;
    }
}
