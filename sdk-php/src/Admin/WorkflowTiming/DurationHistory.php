<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationHistory is the completed duration history for one workflow, with the
 * outcome tally and the active-versus-waiting split of its latest completed run.
 * Steps that overlap are reported per step and never summed into the wall clock.
 */
final readonly class DurationHistory
{
    /** @param list<DurationHistoryEntry> $entries
     *  @param list<ContributionEntry> $contributions
     */
    public function __construct(
        public string $workflowKey = '',
        public string $workflowUuid = '',
        public array $entries = [],
        public OutcomeCounts $outcomes = new OutcomeCounts(),
        public array $contributions = [],
        public ?RunTimingSummary $latestCompletedRun = null,
    ) {
    }

    /** contribution returns one step's share of the active time. */
    public function contribution(string $stepKey): ?ContributionEntry
    {
        foreach ($this->contributions as $entry) {
            if ($entry->stepKey === $stepKey) {
                return $entry;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $latest = Payload::optionalObject($payload, 'latestCompletedRun');

        return new self(
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'workflowUuid'),
            array_map(
                static fn (array $item): DurationHistoryEntry => DurationHistoryEntry::fromPayload($item),
                Payload::objects($payload, 'entries'),
            ),
            OutcomeCounts::fromPayload(Payload::object($payload, 'outcomes')),
            array_map(
                static fn (array $item): ContributionEntry => ContributionEntry::fromPayload($item),
                Payload::objects($payload, 'contributions'),
            ),
            $latest === null ? null : RunTimingSummary::fromPayload($latest),
        );
    }
}
