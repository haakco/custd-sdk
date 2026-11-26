<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessAreaSetting;
use HaakCo\Custd\Admin\MachineAccess\MachineAccessCompanyUpdateRequest;
use HaakCo\Custd\CustdClient;
use HaakCo\Custd\MetadataRecorder;
use HaakCo\Custd\Problem;
use HaakCo\Custd\Reporting\RequestException;
use PHPUnit\Framework\TestCase;

/**
 * MachineAccessTest proves a machine access refusal decodes the same on every route family, from the bodies the
 * gate writes (contract-fixtures), and that a recorder captures the request ID of answers and refusals.
 */
final class MachineAccessTest extends TestCase
{
    private const FIXTURES = __DIR__ . '/../../contract-fixtures/';

    public function testBlockedRefusalNamesTheAreaAndSettingOnAdminAndIngestRoutes(): void
    {
        $body = (string) file_get_contents(self::FIXTURES . 'machine-access-blocked-problem.json');
        $calls = [
            'typed admin route' => fn (CustdClient $c) => $c->adminMachineAccess()->get(),
            'ingest' => fn (CustdClient $c) => $c->ingestEvent(
                json_decode((string) file_get_contents(self::FIXTURES . 'valid-event.json'), true, flags: JSON_THROW_ON_ERROR),
            ),
        ];
        foreach ($calls as $name => $call) {
            try {
                $call(self::client(403, $body));
                self::fail("{$name} accepted a refusal");
            } catch (AdminProblemException $error) {
                self::assertBlocked($error->problem);
                self::assertSame(403, $error->status);
            }
        }
    }

    public function testReportingRefusalCarriesTheProblem(): void
    {
        $body = (string) file_get_contents(self::FIXTURES . 'machine-access-blocked-problem.json');
        try {
            self::client(403, $body)->reporting()->outputs();
            self::fail('reporting accepted a refusal');
        } catch (RequestException $error) {
            self::assertSame(Problem::MACHINE_ACCESS_BLOCKED_CODE, $error->errorCode);
            self::assertNotNull($error->problem);
            self::assertBlocked($error->problem);
        }
    }

    public function testUnavailableRefusalIsABoundedRetryWithoutABlock(): void
    {
        $body = (string) file_get_contents(self::FIXTURES . 'machine-access-unavailable-problem.json');
        try {
            self::client(503, $body)->adminMachineAccess()->getEffective('ci-1');
            self::fail('accepted a refusal');
        } catch (AdminProblemException $error) {
            self::assertSame(Problem::MACHINE_ACCESS_UNAVAILABLE_CODE, $error->problem->code);
            self::assertSame('bounded', $error->problem->retryability);
            self::assertSame('req-machine-access-2', $error->problem->traceId);
            self::assertNull($error->problem->machineAccess);
        }
    }

    public function testCompanyUpdateSendsOnlyTheSettingsItNames(): void
    {
        $sent = [];
        $client = new CustdClient('http://localhost:8080', 'token', [
            'admin_http_client' => static function (string $method, string $url, mixed $body) use (&$sent): array {
                $sent[] = $body;

                return ['status' => 200, 'body' => '{"companySlug":"acme","allowSupportAutomation":true,"areas":null}'];
            },
        ]);

        $policy = $client->adminMachineAccess()->update(
            new MachineAccessCompanyUpdateRequest(areas: [new MachineAccessAreaSetting('reporting', 'blocked')]),
        );

        self::assertSame([['areas' => [['area' => 'reporting', 'state' => 'blocked']]]], $sent);
        self::assertSame([], $policy->areas);
    }

    public function testRecorderCapturesTheRequestIdOfAnswersAndRefusals(): void
    {
        $recorder = new MetadataRecorder();
        $policy = $recorder->record(
            fn () => self::client(200, '{"companySlug":"acme","allowSupportAutomation":true,"areas":[]}')->adminMachineAccess()->get(),
        );
        self::assertSame('acme', $policy->companySlug);
        self::assertSame('req-header-1', $recorder->requestId);

        $refused = new MetadataRecorder();
        try {
            $refused->record(fn () => self::client(403, '{"type":"forbidden","status":403,"code":"x"}')->adminMachineAccess()->get());
            self::fail('accepted a refusal');
        } catch (AdminProblemException) {
            self::assertSame('req-header-1', $refused->requestId);
        }

        self::client(200, '{"companySlug":"acme","allowSupportAutomation":true,"areas":[]}')->adminMachineAccess()->get();
        self::assertSame('req-header-1', $refused->requestId, 'nothing records outside record()');
    }

    private static function assertBlocked(Problem $problem): void
    {
        self::assertSame(Problem::MACHINE_ACCESS_BLOCKED_CODE, $problem->code);
        self::assertSame('req-machine-access-1', $problem->traceId);
        self::assertSame('none', $problem->retryability);
        self::assertNotNull($problem->machineAccess);
        self::assertSame('reporting', $problem->machineAccess->area);
        self::assertSame('machine', $problem->machineAccess->blockedBy);
        self::assertSame('acme', $problem->machineAccess->companySlug);
        self::assertSame('ci-reporting', $problem->machineAccess->clientId);
    }

    private static function client(int $status, string $body): CustdClient
    {
        $answer = static fn (): array => ['status' => $status, 'body' => $body, 'headers' => ['X-Request-Id' => 'req-header-1']];

        return new CustdClient('http://localhost:8080', 'token', [
            'admin_http_client' => $answer,
            'http_client' => $answer,
            'retry' => ['max_attempts' => 1, 'sleeper' => static fn (int $milliseconds): null => null],
        ]);
    }
}
