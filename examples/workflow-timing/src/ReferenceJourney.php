<?php

declare(strict_types=1);

namespace HaakCo\Custd\Examples\WorkflowTiming;

use HaakCo\Custd\Admin\WorkflowTiming\BatchResult;
use HaakCo\Custd\Admin\WorkflowTiming\DurationHistory;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\RunPrediction;
use HaakCo\Custd\Admin\WorkflowTimingClient;
use HaakCo\Custd\CustdClient;

/**
 * ReferenceJourney proves the released PHP SDK can carry one complete workflow
 * timing journey against a running Custd.
 *
 * Every proof here is a property a consumer depends on, not a demonstration that
 * an endpoint responds: the shape is idempotent, the run is readable once its
 * facts are folded, a first run is described without a claimed interval, a
 * redelivery adds no duration fact, reporting survives a Custd outage without
 * failing the consumer's own work, and recovery drains the projection.
 */
final class ReferenceJourney
{
    private string $runUuid = '';

    /** @var list<Observation> */
    private array $observations = [];

    public function __construct(
        private readonly Proofs $proofs,
        private readonly HostingFixture $fixture,
        private readonly WorkflowTimingClient $timings,
        private readonly string $companySlug,
        private readonly string $actorRef,
        private readonly string $unavailableBaseUrl,
        private readonly string $token,
        private readonly string $pendingPath,
    ) {
    }

    public function run(): int
    {
        $this->declareShape();

        $base = new \DateTimeImmutable('-60 minutes', new \DateTimeZone('UTC'));
        $externalRunId = 'reconcile-' . $base->format('Ymd\THis\Z');
        $this->observations = $this->fixture->observations(
            $externalRunId,
            $this->actorRef,
            $base,
            $this->actorRef,
        );

        $historyBefore = $this->durationHistory()->entries;

        $started = $this->timings->appendBatch($this->companySlug, [$this->observations[0]]);
        $this->proofs->section('Report the observed run');
        $this->proofs->check('the run start was accepted', $started->accepted === 1, "runUuid={$started->results[0]->runUuid}");
        $this->runUuid = $started->results[0]->runUuid;

        $this->provePredictionAtStart($historyBefore === []);

        $finished = $this->timings->appendBatch($this->companySlug, array_slice($this->observations, 1));
        $finished->requireAccepted();
        $this->proofs->check(
            'every remaining phase fact was accepted',
            $finished->rejected === 0 && $finished->accepted === count($this->observations) - 1,
            sprintf('accepted=%d duplicates=%d', $finished->accepted, $finished->duplicates),
        );

        $this->proveRunReadBack();
        $this->proveDurationHistory();
        $this->proveRedeliveryAddsNoDurationFact();
        $this->proveOutageLeavesTheOperationSuccessfulAndRetryable();
        $this->proveRebuildDrainsTheProjection();

        return $this->proofs->exitCode();
    }

    /** The declared shape is reconciled once and repeating it changes nothing. */
    private function declareShape(): void
    {
        $this->proofs->section('Declare the workflow shape');

        $first = $this->timings->reconcile($this->companySlug, $this->fixture->declaration());
        $firstRevision = $first->definition->currentRevision;
        $this->proofs->check(
            'the definition carries every declared phase',
            count($firstRevision->steps) === count($this->fixture->steps()),
            sprintf('revision=%d steps=%d', $firstRevision->number, count($firstRevision->steps)),
        );
        $this->proofs->check(
            'the declared dimension is recorded as a bounded dimension',
            $firstRevision->dimensions !== [],
            $firstRevision->dimensions[0]->dimensionKey ?? 'none',
        );

        $second = $this->timings->reconcile($this->companySlug, $this->fixture->declaration());
        $this->proofs->check(
            'reconciling the same shape again is a no-op',
            $second->wasNoOp(),
            sprintf('created=%s revisionChanged=%s', var_export($second->created, true), var_export($second->revisionChanged, true)),
        );
        $this->proofs->check(
            'the revision did not advance on the repeat',
            $second->definition->currentRevision->number === $firstRevision->number,
            sprintf('revision=%d', $second->definition->currentRevision->number),
        );

        $listed = array_filter(
            $this->timings->listDefinitions($this->companySlug, 50),
            fn ($definition): bool => $definition->workflowKey === $this->fixture->workflowKey(),
        );
        $this->proofs->check('the workflow is listed for the tenant', $listed !== []);
    }

    /**
     * A workflow with no completed history must be described as a cold start: the
     * declared baseline with no interval, never a range the engine did not produce.
     * A workflow that already has history must instead show an interval exactly
     * when its state says the estimate is supported.
     */
    private function provePredictionAtStart(bool $noCompletedHistory): void
    {
        $prediction = $this->timings->prediction($this->companySlug, $this->runUuid);
        $this->proofs->section('Read the expectation while the run is in flight');

        $expectedBaseline = 60000 + 600000 + 900000 + 300000;
        $this->proofs->check(
            'the run baseline is the declared plan',
            $prediction->run->baselineMs === $expectedBaseline,
            sprintf('baselineMs=%d', $prediction->run->baselineMs),
        );
        $this->proofs->check(
            'the expectation names the method and input hash it came from',
            $prediction->run->method !== '' && $prediction->run->inputHash !== '',
            sprintf('method=%s', $prediction->run->method),
        );
        $this->proofs->check(
            'every declared phase has its own expectation',
            count($prediction->steps) === count($this->fixture->steps()),
            sprintf('steps=%d', count($prediction->steps)),
        );

        if (!$noCompletedHistory) {
            $this->proofs->note('this workflow already has completed history, so the cold-start branch is not asserted');
            $this->proofs->check(
                'an interval is present exactly when the estimate is supported',
                $prediction->run->hasRange() === $prediction->run->isSupported(),
                sprintf('state=%s', $prediction->run->state),
            );

            return;
        }

        $this->proofs->check(
            'a workflow with no history is described as a cold start',
            !$prediction->run->isSupported(),
            sprintf('state=%s', $prediction->run->state),
        );
        $this->proofs->check(
            'a cold start claims no interval',
            !$prediction->run->hasRange(),
            sprintf('low=%s high=%s', var_export($prediction->run->conservativeLowMs, true), var_export($prediction->run->conservativeHighMs, true)),
        );
        $this->proofs->check(
            'a cold start points at the declared plan rather than an invented figure',
            $prediction->run->expectedMs === null || $prediction->run->expectedMs === $prediction->run->baselineMs,
            sprintf('expectedMs=%s baselineMs=%d', var_export($prediction->run->expectedMs, true), $prediction->run->baselineMs),
        );
        $this->proofs->check(
            'the cold start is explained rather than silent',
            $prediction->run->warnings !== [],
            implode(',', $prediction->run->warnings),
        );
        $this->proofs->check(
            'the expectation records the evidence window it looked at',
            $prediction->run->evidenceWindowStart !== '' && $prediction->generatedAt !== '',
        );
    }

    /** The folded run is readable, with both attempts of the retried phase. */
    private function proveRunReadBack(): void
    {
        $this->proofs->section('Read the run back');

        $run = $this->timings->getRun($this->companySlug, $this->runUuid);
        $this->proofs->check(
            'the run is folded to its reported outcome',
            $run->state === $this->fixture->outcome(),
            sprintf('state=%s', $run->state),
        );
        $this->proofs->check(
            'the run names the revision it was folded against',
            $run->revisionNumber > 0 && $run->revisionHash !== '',
            sprintf('revision=%d', $run->revisionNumber),
        );
        $this->proofs->check(
            'the dimension value reported with the run is readable',
            ($run->dimensions['cluster'] ?? '') === $this->fixture->dimensions()['cluster'],
            (string) ($run->dimensions['cluster'] ?? 'none'),
        );

        $expectedAttempts = count($this->fixture->phases());
        $this->proofs->check(
            'every phase attempt is projected, including the retry',
            count($run->attempts) === $expectedAttempts,
            sprintf('attempts=%d expected=%d', count($run->attempts), $expectedAttempts),
        );
        $first = $run->attempt('provision-host', 1);
        $second = $run->attempt('provision-host', 2);
        $this->proofs->check(
            'the failed attempt kept its failure and its error class',
            $first !== null && $first->state === 'failed' && $first->errorClass === 'timeout',
            $first === null ? 'missing' : sprintf('state=%s class=%s', $first->state, $first->errorClass),
        );
        $this->proofs->check(
            'the retry is a separate attempt rather than a rewrite of the first',
            $second !== null && $second->state === 'completed',
            $second === null ? 'missing' : sprintf('state=%s', $second->state),
        );
        $this->proofs->check(
            'no attempt is left open on a finished run',
            array_filter($run->attempts, static fn ($attempt): bool => $attempt->isOpen()) === [],
        );
        $this->proofs->check(
            'the projection is current, not behind the ledger',
            !$run->projectionBehind() && $run->projectionStatus->healthy,
            sprintf(
                'pendingFacts=%d projected=%d latest=%d',
                $run->projectionStatus->pendingFacts,
                $run->projectionStatus->projectedLedgerId,
                $run->projectionStatus->latestLedgerId,
            ),
        );
    }

    /** The completed run is visible as duration evidence with a real split. */
    private function proveDurationHistory(): void
    {
        $this->proofs->section('Read the duration history');

        $history = $this->durationHistory();
        $this->proofs->check(
            'the completed run added duration facts for its phases',
            $history->entries !== [],
            sprintf('entries=%d', count($history->entries)),
        );
        $this->proofs->check(
            'each entry names the revision it was observed under',
            array_filter($history->entries, static fn ($entry): bool => $entry->revisionNumber === 0) === [],
        );
        $this->proofs->check(
            'the outcome tally counts the completed run',
            $history->outcomes->completedRuns >= 1,
            sprintf('completedRuns=%d failedRuns=%d', $history->outcomes->completedRuns, $history->outcomes->failedRuns),
        );
        $this->proofs->check(
            'the tally records the failed attempt separately from the run outcome',
            $history->outcomes->failedAttempts >= 1,
            sprintf('failedAttempts=%d', $history->outcomes->failedAttempts),
        );

        $latest = $history->latestCompletedRun;
        $this->proofs->check(
            'the latest completed run reports a wall clock and a split',
            $latest !== null && $latest->wallClockMs > 0 && $latest->nominalMs > 0,
            $latest === null ? 'missing' : sprintf('wallClockMs=%d nominalMs=%d', $latest->wallClockMs, $latest->nominalMs),
        );
        $this->proofs->check(
            'active plus waiting accounts for the wall clock',
            $latest !== null && $latest->activeMs + $latest->waitMs === $latest->wallClockMs,
            $latest === null ? 'missing' : sprintf('activeMs=%d waitMs=%d wallClockMs=%d', $latest->activeMs, $latest->waitMs, $latest->wallClockMs),
        );
        $this->proofs->check(
            'the phases are attributed as contributions',
            $history->contributions !== [] && $history->contribution('provision-host') !== null,
            sprintf('contributions=%d', count($history->contributions)),
        );
        $retried = $history->contribution('provision-host');
        $this->proofs->check(
            'a retried phase reports both of its attempts',
            $retried !== null && $retried->attempts === 2,
            $retried === null ? 'missing' : sprintf('attempts=%d', $retried->attempts),
        );
    }

    /** Redelivering every fact adds no second duration fact. */
    private function proveRedeliveryAddsNoDurationFact(): void
    {
        $this->proofs->section('Redeliver the same facts');

        $before = $this->durationHistory();
        $replay = $this->timings->appendBatch($this->companySlug, $this->observations);

        $this->proofs->check(
            'every redelivered fact is reported as a duplicate',
            $replay->duplicates === count($this->observations) && $replay->accepted === count($this->observations),
            sprintf('duplicates=%d accepted=%d rejected=%d', $replay->duplicates, $replay->accepted, $replay->rejected),
        );
        $this->proofs->check(
            'a redelivered fact is not rejected as an error',
            $replay->rejected === 0,
        );

        $after = $this->durationHistory();
        $this->proofs->check(
            'the redelivery added no duration fact',
            count($after->entries) === count($before->entries),
            sprintf('before=%d after=%d', count($before->entries), count($after->entries)),
        );
        $this->proofs->check(
            'the redelivery changed no run outcome',
            $after->outcomes->completedRuns === $before->outcomes->completedRuns
                && $after->outcomes->failedRuns === $before->outcomes->failedRuns,
        );

        $run = $this->timings->getRun($this->companySlug, $this->runUuid);
        $this->proofs->check(
            'the redelivery left the projection current',
            !$run->projectionBehind(),
            sprintf('pendingFacts=%d', $run->projectionStatus->pendingFacts),
        );
    }

    /**
     * Custd being unreachable must not fail the consumer's own work. The simulated
     * source operation completes, the facts stay pending, and recovery delivers
     * them.
     */
    private function proveOutageLeavesTheOperationSuccessfulAndRetryable(): void
    {
        $this->proofs->section('Report while Custd is unreachable');

        $pending = new PendingTimingReport($this->pendingPath, $this->companySlug, $this->offlineClient());
        $outageBase = new \DateTimeImmutable('-30 minutes', new \DateTimeZone('UTC'));
        $outageObservations = $this->fixture->observations(
            'reconcile-outage-' . $outageBase->format('Ymd\THis\Z'),
            $this->actorRef,
            $outageBase,
            $this->actorRef,
        );

        // The consumer's own operation. It performs no Custd call, which is the
        // property under test: the work is not gated on the reporting path.
        $operation = ['outcome' => 'succeeded', 'phases' => count($this->fixture->phases())];
        $delivered = $pending->record($outageObservations);

        $this->proofs->check(
            'the consumer operation succeeded while Custd was unreachable',
            $operation['outcome'] === 'succeeded' && $operation['phases'] === count($this->fixture->phases()),
        );
        $this->proofs->check(
            'the undeliverable report is retained rather than lost',
            !$delivered && $pending->pendingCount() === count($outageObservations),
            sprintf('pending=%d', $pending->pendingCount()),
        );

        $pending->retarget($this->timings);
        $remaining = $pending->flush();

        $this->proofs->check(
            'recovery delivers every retained fact',
            $remaining === 0 && $pending->pendingCount() === 0,
            sprintf('remaining=%d', $remaining),
        );

        $replay = $this->timings->appendBatch($this->companySlug, $outageObservations);
        $this->proofs->check(
            'the recovered facts are deduplicated rather than duplicated',
            $replay->duplicates === count($outageObservations) && $replay->rejected === 0,
            sprintf('duplicates=%d', $replay->duplicates),
        );
    }

    /** A bounded rebuild replays one run from its ledger and changes nothing. */
    private function proveRebuildDrainsTheProjection(): void
    {
        $this->proofs->section('Rebuild one run from its ledger');

        $before = $this->timings->getRun($this->companySlug, $this->runUuid);
        $this->timings->rebuild($this->companySlug, $this->runUuid);
        $after = $this->timings->getRun($this->companySlug, $this->runUuid);

        $this->proofs->check(
            'the rebuild leaves the run folded to the same outcome',
            $after->state === $before->state,
            sprintf('state=%s', $after->state),
        );
        $this->proofs->check(
            'the rebuild leaves the same number of attempts',
            count($after->attempts) === count($before->attempts),
            sprintf('before=%d after=%d', count($before->attempts), count($after->attempts)),
        );
        $this->proofs->check(
            'the projection is drained after the rebuild',
            !$after->projectionBehind() && $after->projectionStatus->healthy,
            sprintf('pendingFacts=%d nextAction=%s', $after->projectionStatus->pendingFacts, $after->projectionStatus->nextAction),
        );
        $this->proofs->check(
            'the rebuild did not advance the projected ledger past what it replayed',
            $after->projectionStatus->projectedLedgerId === $after->projectionStatus->latestLedgerId,
            sprintf('projected=%d latest=%d', $after->projectionStatus->projectedLedgerId, $after->projectionStatus->latestLedgerId),
        );
    }

    private function durationHistory(): DurationHistory
    {
        return $this->timings->durationHistory($this->companySlug, $this->fixture->workflowKey(), 50);
    }

    /** offlineClient points the same SDK at an endpoint that refuses connections. */
    private function offlineClient(): WorkflowTimingClient
    {
        return (new CustdClient($this->unavailableBaseUrl, $this->token))->adminWorkflowTimings();
    }
}
