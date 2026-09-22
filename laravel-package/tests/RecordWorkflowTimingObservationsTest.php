<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Tests;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowTimingIdempotency;
use HaakCo\Custd\CustdClient;
use HaakCo\LaravelCustd\CustdServiceProvider;
use HaakCo\LaravelCustd\Jobs\RecordWorkflowTimingObservations;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Jobs\SyncJob;
use Orchestra\Testbench\TestCase;

/**
 * The job is the queue-safe path for reporting observed workflow facts. These
 * tests pin the two behaviours a consumer depends on: an accepted batch finishes
 * quietly (including duplicates), and a rejected batch fails without retrying,
 * because a rejected fact is permanent.
 */
final class RecordWorkflowTimingObservationsTest extends TestCase
{
    public function testRecordsTheObservedFactsForTheTenant(): void
    {
        $sent = [];
        $client = $this->clientWithBody(
            '{"results":[{"index":0,"accepted":true,"duplicate":false,"workflowKey":"hosting.reconcile",'
            . '"externalRunId":"op-1","idempotencyKey":"k0","runUuid":"run-1"}],"accepted":1,"rejected":0,"duplicates":0}',
            $sent,
        );

        $job = $this->attachedJob([$this->runStarted()]);
        $job->handle($client);

        $this->assertFalse($this->syncJob->hasFailed());
        $this->assertSame('POST', $sent[0]['method']);
        $this->assertSame(
            'http://localhost:8080/api/v1/admin/workflow-timings/observations:batch?companySlug=acme',
            $sent[0]['url'],
        );
        $this->assertSame('hosting.reconcile', $sent[0]['body']['observations'][0]['workflowKey']);
        $this->assertSame('run_started', $sent[0]['body']['observations'][0]['fact']['kind']);
    }

    public function testARedeliveredBatchFinishesQuietlyWhenEveryItemIsADuplicate(): void
    {
        $sent = [];
        $client = $this->clientWithBody(
            '{"results":[{"index":0,"accepted":true,"duplicate":true,"workflowKey":"hosting.reconcile",'
            . '"externalRunId":"op-1","idempotencyKey":"k0"}],"accepted":1,"rejected":0,"duplicates":1}',
            $sent,
        );

        $job = $this->attachedJob([$this->runStarted()]);
        $job->handle($client);

        $this->assertFalse($this->syncJob->hasFailed());
    }

    public function testRejectedFactsFailTheJobWithoutRetrying(): void
    {
        $sent = [];
        $client = $this->clientWithBody(
            (string) file_get_contents(__DIR__ . '/../../contract-fixtures/workflow-timing-batch-result-partial.json'),
            $sent,
        );

        $job = $this->attachedJob([$this->runStarted()]);
        $job->handle($client);

        // Failing rather than throwing is what stops a permanent rejection from
        // burning the retry budget: an undeclared step stays undeclared.
        $this->assertTrue($this->syncJob->hasFailed());
    }

    public function testRejectionIsNeverSwallowedWithoutAQueueContext(): void
    {
        $sent = [];
        $client = $this->clientWithBody(
            (string) file_get_contents(__DIR__ . '/../../contract-fixtures/workflow-timing-batch-result-partial.json'),
            $sent,
        );

        $job = new RecordWorkflowTimingObservations('acme', [$this->runStarted()]);

        $this->expectException(AdminWorkflowException::class);
        $this->expectExceptionMessageMatches('/1 of 3/');
        $job->handle($client);
    }

    public function testJobUsesLaravelQueueTraitsAndConfigDefaults(): void
    {
        $this->app['config']->set('custd.job.tries', 5);
        $this->app['config']->set('custd.job.backoff', 30);

        $job = new RecordWorkflowTimingObservations('acme', [$this->runStarted()]);

        $this->assertContains(Dispatchable::class, class_uses_recursive(RecordWorkflowTimingObservations::class));
        $this->assertContains(InteractsWithQueue::class, class_uses_recursive(RecordWorkflowTimingObservations::class));
        $this->assertContains(Queueable::class, class_uses_recursive(RecordWorkflowTimingObservations::class));
        $this->assertSame(5, $job->tries);
        $this->assertSame(30, $job->backoff);
    }

    public function testSerializedPayloadCarriesNoSecret(): void
    {
        $this->app['config']->set('custd.token', 'super-secret-token');

        $job = new RecordWorkflowTimingObservations('acme', [$this->runStarted()]);

        $this->assertStringNotContainsString('super-secret-token', serialize($job));
    }

    private ?SyncJob $syncJob = null;

    /**
     * @return array<class-string, int>
     */
    protected function getPackageProviders($app): array
    {
        return [CustdServiceProvider::class];
    }

    private function runStarted(): Observation
    {
        return Observation::runStarted(
            'hosting.reconcile',
            'op-1',
            '2026-09-22T10:00:00Z',
            WorkflowTimingIdempotency::runStarted('hosting.reconcile', 'op-1'),
            'hosting-worker-7',
        );
    }

    /**
     * @param list<Observation> $observations
     */
    private function attachedJob(array $observations): RecordWorkflowTimingObservations
    {
        $job = new RecordWorkflowTimingObservations('acme', $observations);

        // A real queue payload carries the serialized command, and failing a job
        // goes through that payload, so the double has to carry it too.
        $this->syncJob = new SyncJob(
            $this->app,
            (string) json_encode([
                'uuid' => 'test-job-uuid',
                'job' => 'Illuminate\Queue\CallQueuedHandler@call',
                'data' => [
                    'commandName' => RecordWorkflowTimingObservations::class,
                    'command' => serialize($job),
                ],
            ]),
            'sync',
            'default',
        );
        $job->setJob($this->syncJob);

        return $job;
    }

    /**
     * @param list<array{method: string, url: string, body: array<string, mixed>}> $sent
     */
    private function clientWithBody(string $body, array &$sent): CustdClient
    {
        return new CustdClient('http://localhost:8080', 'admin-token', [
            'admin_http_client' => static function (string $method, string $url, ?array $payload) use (&$sent, $body): array {
                $sent[] = ['method' => $method, 'url' => $url, 'body' => $payload ?? []];
                return ['status' => 200, 'body' => $body];
            },
        ]);
    }
}
