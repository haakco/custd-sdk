<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

/**
 * WorkflowTimingIdempotency builds the deterministic identity of one observed
 * fact.
 *
 * The key is derived from the fact itself, so a retried delivery of the same
 * observation is a no-op rather than a second fact, and a redelivery after an
 * outage cannot inflate duration history. Consumers must use these builders
 * instead of inventing their own key shape.
 */
final class WorkflowTimingIdempotency
{
    public static function runStarted(string $workflowKey, string $externalRunId): string
    {
        return self::key($workflowKey, $externalRunId, 'run_started');
    }

    public static function runFinished(string $workflowKey, string $externalRunId): string
    {
        return self::key($workflowKey, $externalRunId, 'run_finished');
    }

    public static function stepStarted(string $workflowKey, string $externalRunId, string $stepKey, int $attempt): string
    {
        return self::key($workflowKey, $externalRunId, 'step_started', $stepKey, $attempt);
    }

    public static function stepFinished(string $workflowKey, string $externalRunId, string $stepKey, int $attempt): string
    {
        return self::key($workflowKey, $externalRunId, 'step_finished', $stepKey, $attempt);
    }

    private static function key(
        string $workflowKey,
        string $externalRunId,
        string $kind,
        string $stepKey = '',
        int $attempt = 0,
    ): string {
        $parts = ['workflow-timing', $workflowKey, $externalRunId, $kind];
        if ($stepKey !== '') {
            $parts[] = $stepKey;
            $parts[] = (string) $attempt;
        }
        return implode(':', $parts);
    }
}
