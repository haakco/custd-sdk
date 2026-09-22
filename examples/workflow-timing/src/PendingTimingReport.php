<?php

declare(strict_types=1);

namespace HaakCo\Custd\Examples\WorkflowTiming;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\WorkflowTimingClient;

/**
 * PendingTimingReport spools observed facts locally and delivers them when Custd
 * is reachable.
 *
 * This is the shape that keeps the ownership split honest. The consumer's own
 * work does not depend on Custd: reporting is a separate step that may fail and be
 * retried. A delivery failure leaves the facts pending rather than failing the
 * operation, and because every fact carries the identity derived from itself, a
 * retry of an already-delivered fact is a duplicate instead of a second duration
 * fact.
 *
 * A real consumer already has a queue and should use it; this example keeps a
 * small durable file so the journey can demonstrate the retry without standing up
 * a queue. Facts are stored as serialized observations purely to keep the example
 * to one file — the payload array from Observation::toPayload() is what belongs in
 * a real spool.
 */
final class PendingTimingReport
{
    public function __construct(
        private readonly string $path,
        private string $companySlug,
        private WorkflowTimingClient $client,
    ) {
    }

    /** retarget points delivery at a recovered client, keeping the pending facts. */
    public function retarget(WorkflowTimingClient $client): void
    {
        $this->client = $client;
    }

    /**
     * record spools the facts and attempts delivery once.
     *
     * @param list<Observation> $observations
     * @return bool whether the facts were accepted by Custd on this attempt
     */
    public function record(array $observations): bool
    {
        $this->spool($observations);

        try {
            $remaining = $this->deliver();
        } catch (\RuntimeException $unavailable) {
            // Custd unreachable is not the consumer's failure: keep the facts and
            // report that delivery is still pending.
            $this->log('delivery deferred: ' . $unavailable->getMessage());

            return false;
        } catch (AdminWorkflowException $rejected) {
            // A rejected fact is permanent, so surface it instead of retrying it
            // forever behind a queue.
            throw $rejected;
        }

        return $remaining === 0;
    }

    /** pendingCount is the number of facts Custd has not accepted yet. */
    public function pendingCount(): int
    {
        return count($this->load());
    }

    /**
     * flush retries every pending fact. It returns the number still pending, so a
     * caller can distinguish "delivered" from "still unreachable".
     */
    public function flush(): int
    {
        return $this->deliver();
    }

    private function deliver(): int
    {
        $pending = $this->load();
        if ($pending === []) {
            return 0;
        }

        /** @var list<Observation> $observations */
        $observations = array_values(array_map(
            static fn (string $encoded): Observation => unserialize($encoded, ['allowed_classes' => true]),
            $pending,
        ));

        $result = $this->client->appendBatch($this->companySlug, $observations);
        $result->requireAccepted();

        $delivered = [];
        foreach ($result->results as $item) {
            if ($item->accepted) {
                $delivered[$item->idempotencyKey] = true;
            }
        }
        $stillPending = [];
        foreach ($pending as $key => $encoded) {
            if (!isset($delivered[$key])) {
                $stillPending[$key] = $encoded;
            }
        }
        $this->save($stillPending);

        return count($stillPending);
    }

    /** @param list<Observation> $observations */
    private function spool(array $observations): void
    {
        $pending = $this->load();
        foreach ($observations as $observation) {
            $pending[$observation->idempotencyKey] = serialize($observation);
        }
        $this->save($pending);
    }

    /** @return array<string, string> */
    private function load(): array
    {
        if (!is_file($this->path)) {
            return [];
        }
        $contents = file_get_contents($this->path);
        if ($contents === false || $contents === '') {
            return [];
        }
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, string> $pending */
    private function save(array $pending): void
    {
        // The store survives only as long as the process; the point is durability
        // across a Custd outage within the journey, not across a reboot.
        if ($pending === []) {
            @unlink($this->path);

            return;
        }
        file_put_contents($this->path, json_encode($pending, JSON_THROW_ON_ERROR));
    }

    private function log(string $message): void
    {
        fwrite(STDERR, "  [pending-report] {$message}\n");
    }
}
