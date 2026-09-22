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
    /** @param list<array<string, mixed>> $entries
     *  @param list<array<string, mixed>> $contributions
     */
    public function __construct(
        public string $workflowKey = '',
        public string $workflowUuid = '',
        public array $entries = [],
        public array $contributions = [],
        public int $wallClockMs = 0,
        public int $activeMs = 0,
        public int $waitMs = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $latest = Payload::object($payload, 'latestCompletedRun');
        return new self(
            Payload::string($payload, 'workflowKey'),
            Payload::string($payload, 'workflowUuid'),
            Payload::objects($payload, 'entries'),
            Payload::objects($payload, 'contributions'),
            Payload::optionalInteger($latest, 'wallClockMs') ?? 0,
            Payload::optionalInteger($latest, 'activeMs') ?? 0,
            Payload::optionalInteger($latest, 'waitMs') ?? 0,
        );
    }
}
