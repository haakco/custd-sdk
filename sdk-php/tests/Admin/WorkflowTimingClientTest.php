<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\WorkflowTiming\Observation;
use HaakCo\Custd\Admin\WorkflowTiming\StepDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowDeclaration;
use HaakCo\Custd\Admin\WorkflowTiming\WorkflowTimingIdempotency;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * The workflow timing façade reports work another system performed. These tests
 * pin the shape a consumer depends on: a declarative definition, deterministic
 * idempotency, per-item append results, and the evidence state of a prediction.
 */
final class WorkflowTimingClientTest extends TestCase
{
    public function testReconcileSendsTheDeclarativeShape(): void
    {
        $calls = [];
        $client = $this->client($calls, static fn (): array => [
            'status' => 200,
            'body' => json_encode(['definition' => [
                'uuid' => 'wf-1',
                'workflowKey' => 'hosting.reconcile',
                'name' => 'Hosting reconcile',
                'status' => 'active',
                'revisionCount' => 1,
                'currentRevision' => [
                    'uuid' => 'rev-1',
                    'number' => 1,
                    'hash' => str_repeat('a', 64),
                    'allowOverlap' => false,
                    'steps' => [['stepKey' => 'foundation', 'name' => 'Foundation', 'nominalMs' => 600000]],
                ],
            ]], JSON_THROW_ON_ERROR),
        ]);

        $definition = $client->adminWorkflowTimings()->reconcile(
            'acme',
            new WorkflowDeclaration(
                workflowKey: 'hosting.reconcile',
                name: 'Hosting reconcile',
                dimensions: ['cluster'],
            )->withStep(new StepDeclaration('foundation', 'Foundation', 600000)),
        );

        $this->assertSame('PUT', $calls[0]['method']);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/definitions/hosting.reconcile?companySlug=acme',
            $this->path($calls[0]['url']),
        );
        $this->assertSame('hosting.reconcile', $calls[0]['body']['workflowKey']);
        $this->assertSame('foundation', $calls[0]['body']['steps'][0]['stepKey']);
        $this->assertSame(600000, $calls[0]['body']['steps'][0]['nominalMs']);
        $this->assertSame(1, $definition->revisionNumber);
        $this->assertSame(str_repeat('a', 64), $definition->revisionHash);
        $this->assertSame(1, $definition->revisionCount);
        $this->assertCount(1, $definition->steps);
    }

    public function testAppendCarriesAFactAndItsDeterministicKey(): void
    {
        $calls = [];
        $client = $this->client($calls, static fn (): array => [
            'status' => 200,
            'body' => json_encode([
                'results' => [[
                    'index' => 0, 'accepted' => true, 'duplicate' => false,
                    'idempotencyKey' => 'workflow-timing:hosting.reconcile:op-1:step_finished:foundation:1',
                    'runUuid' => 'run-1', 'factUuid' => 'fact-1',
                ]],
                'accepted' => 1, 'rejected' => 0, 'duplicates' => 0,
            ], JSON_THROW_ON_ERROR),
        ]);

        $key = WorkflowTimingIdempotency::stepFinished('hosting.reconcile', 'op-1', 'foundation', 1);
        $result = $client->adminWorkflowTimings()->append(
            'acme',
            Observation::stepFinished('hosting.reconcile', 'op-1', '2026-09-22T10:00:30Z', $key, 'foundation'),
        )->requireAccepted();

        $this->assertSame(
            '/api/v1/admin/workflow-timings/observations?companySlug=acme',
            $this->path($calls[0]['url']),
        );
        $body = $calls[0]['body']['observation'];
        $this->assertSame($key, $body['idempotencyKey']);
        $this->assertSame('step_finished', $body['fact']['kind']);
        $this->assertSame('foundation', $body['fact']['step']['stepKey']);
        $this->assertSame('completed', $body['fact']['step']['state']);
        $this->assertSame('run-1', $result->results[0]->runUuid);
    }

    public function testIdempotencyKeysAreDeterministicPerFact(): void
    {
        $this->assertSame(
            'workflow-timing:hosting.reconcile:op-1:run_started',
            WorkflowTimingIdempotency::runStarted('hosting.reconcile', 'op-1'),
        );
        $this->assertSame(
            'workflow-timing:hosting.reconcile:op-1:step_started:foundation:2',
            WorkflowTimingIdempotency::stepStarted('hosting.reconcile', 'op-1', 'foundation', 2),
        );
        $this->assertNotSame(
            WorkflowTimingIdempotency::stepStarted('hosting.reconcile', 'op-1', 'foundation', 1),
            WorkflowTimingIdempotency::stepFinished('hosting.reconcile', 'op-1', 'foundation', 1),
        );
    }

    public function testPartialBatchFailsWithItemContext(): void
    {
        $calls = [];
        $client = $this->client($calls, static fn (): array => [
            'status' => 200,
            'body' => json_encode([
                'results' => [
                    ['index' => 0, 'accepted' => true, 'duplicate' => false, 'idempotencyKey' => 'k0'],
                    [
                        'index' => 1, 'accepted' => false, 'duplicate' => false,
                        'idempotencyKey' => 'k1', 'errorCode' => 'workflow_step_unknown',
                        'errorMessage' => 'workflow timings: step is not declared by the definition',
                    ],
                ],
                'accepted' => 1, 'rejected' => 1, 'duplicates' => 0,
            ], JSON_THROW_ON_ERROR),
        ]);

        $result = $client->adminWorkflowTimings()->appendBatch('acme', [
            Observation::runStarted('hosting.reconcile', 'op-1', '2026-09-22T10:00:00Z', 'k0'),
            Observation::stepStarted('hosting.reconcile', 'op-1', '2026-09-22T10:00:01Z', 'k1', 'nope'),
        ]);

        $this->assertSame(1, $result->accepted);
        $this->assertSame(1, $result->rejected);
        try {
            $result->requireAccepted();
            $this->fail('a partially applied batch reported success');
        } catch (AdminWorkflowException $exception) {
            $this->assertStringContainsString('1 of 2', $exception->getMessage());
            $this->assertStringContainsString('k1', $exception->getMessage());
            $this->assertStringContainsString('workflow_step_unknown', $exception->getMessage());
        }
    }

    public function testPredictionKeepsAColdStartDistinctFromASupportedRange(): void
    {
        $calls = [];
        $client = $this->client($calls, static fn (): array => [
            'status' => 200,
            'body' => json_encode([
                'runUuid' => 'run-1',
                'workflowKey' => 'hosting.reconcile',
                'externalRunId' => 'op-1',
                'state' => 'running',
                'allowOverlap' => false,
                'run' => [
                    'seriesKey' => 'workflow_run', 'state' => 'cold_start', 'baselineMs' => 600000,
                    'sampleCount' => 0, 'method' => 'nominal', 'methodVersion' => 'nominal.v1',
                    'inputHash' => str_repeat('b', 64), 'warnings' => ['cold_start'],
                ],
                'steps' => [],
            ], JSON_THROW_ON_ERROR),
        ]);

        $prediction = $client->adminWorkflowTimings()->prediction('acme', 'run-1');

        $this->assertSame('cold_start', $prediction->run->state);
        $this->assertFalse($prediction->run->isSupported());
        $this->assertNull($prediction->run->conservativeLowMs);
        $this->assertSame(600000, $prediction->run->baselineMs);
        $this->assertSame(['cold_start'], $prediction->run->warnings);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/runs/run-1/prediction?companySlug=acme',
            $this->path($calls[0]['url']),
        );
    }

    public function testDurationHistorySeparatesActiveFromWait(): void
    {
        $calls = [];
        $client = $this->client($calls, static fn (): array => [
            'status' => 200,
            'body' => json_encode([
                'workflowKey' => 'hosting.reconcile',
                'workflowUuid' => 'wf-1',
                'entries' => [['stepKey' => 'foundation', 'valueMs' => 29000]],
                'contributions' => [['stepKey' => 'foundation', 'attempts' => 1, 'totalMs' => 29000]],
                'latestCompletedRun' => ['wallClockMs' => 30000, 'activeMs' => 29000, 'waitMs' => 1000],
            ], JSON_THROW_ON_ERROR),
        ]);

        $history = $client->adminWorkflowTimings()->durationHistory('acme', 'hosting.reconcile', 10);

        $this->assertSame(30000, $history->wallClockMs);
        $this->assertSame(29000, $history->activeMs);
        $this->assertSame(1000, $history->waitMs);
        $this->assertCount(1, $history->contributions);
        $this->assertSame(
            '/api/v1/admin/workflow-timings/definitions/hosting.reconcile/duration-history?companySlug=acme&limit=10',
            $this->path($calls[0]['url']),
        );
    }

    private function path(string $url): string
    {
        return str_replace('http://localhost:8080', '', $url);
    }

    /**
     * @param list<array{method: string, url: string, body: array<string, mixed>}> $calls
     * @return CustdClient
     */
    private function client(array &$calls, callable $respond): CustdClient
    {
        return new CustdClient('http://localhost:8080', 'admin-token', [
            'admin_http_client' => static function (string $method, string $url, ?array $payload) use (&$calls, $respond): array {
                $calls[] = ['method' => $method, 'url' => $url, 'body' => $payload ?? []];
                return $respond();
            },
        ]);
    }
}
