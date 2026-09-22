<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Jobs;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\CustdClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Records observed workflow-timing facts for one tenant through the queue.
 *
 * Custd is not the controller: the caller decides when its own run and steps
 * started and finished and reports what it observed after its own commit. This
 * job never starts, retries or cancels the caller's work.
 *
 * Redelivery is safe. Build every observation's identity with
 * WorkflowTimingIdempotency so the key is derived from the fact itself; a queue
 * retry after an outage then re-sends the same keys and the server reports them
 * as duplicates instead of adding a second duration fact. Do not build a key from
 * a counter or a clock inside this job.
 *
 * A fully accepted batch finishes quietly, including when every item was a
 * duplicate. A partially rejected batch fails the job without retrying: an
 * undeclared step, an unknown dimension or a conflicting idempotency key does not
 * become valid on a later attempt, so retrying would only delay the report and
 * burn attempts. The rejected items and their machine codes stay visible in
 * failed_jobs.
 */
final class RecordWorkflowTimingObservations implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;

    public int $tries;

    public int $backoff;

    /**
     * @param list<Observation> $observations
     */
    public function __construct(
        private readonly string $companySlug,
        private readonly array $observations,
    ) {
        $this->tries = (int) config('custd.job.tries', 3);
        $this->backoff = (int) config('custd.job.backoff', 10);
    }

    public function handle(CustdClient $client): void
    {
        $result = $client->adminWorkflowTimings()->appendBatch($this->companySlug, $this->observations);

        try {
            $result->requireAccepted();
        } catch (AdminWorkflowException $rejection) {
            // Without a queue context InteractsWithQueue::fail() is a silent no-op,
            // so a direct call must raise the rejection rather than swallow it.
            if ($this->job === null) {
                throw $rejection;
            }

            $this->fail($rejection);
        }
    }
}
