<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** DurationProjection is the duration split a rebuild wrote for one run. */
final readonly class DurationProjection
{
    /**
     * @param list<StepDuration> $steps
     * @param list<ExcludedStep> $excluded
     */
    public function __construct(
        public bool $runEligible,
        public RunDuration $run,
        public array $steps,
        public array $excluded,
        public int $activeMs,
        public int $waitMs,
        public int $openAttempts,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Payload::boolean($payload, 'runEligible'),
            RunDuration::fromPayload(Payload::object($payload, 'run')),
            array_map(StepDuration::fromPayload(...), Payload::objects($payload, 'steps')),
            array_map(ExcludedStep::fromPayload(...), Payload::objects($payload, 'excluded')),
            Payload::integer($payload, 'activeMs'),
            Payload::integer($payload, 'waitMs'),
            Payload::integer($payload, 'openAttempts'),
        );
    }
}
