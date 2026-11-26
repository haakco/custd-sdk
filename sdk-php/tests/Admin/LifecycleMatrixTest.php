<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests\Admin;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\AdminWorkflowException;
use HaakCo\Custd\Admin\Offboarding\OffboardingRequestBody;
use HaakCo\Custd\Admin\Offboarding\OffboardingScheduleRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureCreateRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureSelector;
use HaakCo\Custd\Admin\Retention\RetentionPolicyUpsertRequest;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportCreateRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportScope;

/**
 * The client-data-lifecycle behaviours the route conformance cannot show: what a subject export, erasure,
 * retention or offboarding call sends beyond its path, and how the server's refusals surface. Response bodies
 * are the operation examples in contract-fixtures/api/examples or bodies written from the server's own types.
 */
final class LifecycleMatrixTest extends TestCase
{
    private const BASE_URL = "http://localhost:8080";
    private const REQUEST = "0198a3b2-0000-7000-8000-000000000001";

    /**
     * Build a client whose admin transport serves a fixed response queue and records every request.
     *
     * @param array<int, array{0: int, 1: string, 2?: array<string, string>}> $queue
     * @return array{0: CustdClient, 1: AdminTransportRecorder}
     */
    private function client(array $queue): array
    {
        // A shared object keeps the queue and the recorded calls visible after each closure invocation.
        $bag = new AdminTransportRecorder(array_values($queue));
        $transport = function (string $method, string $url, ?array $body, string $token, array $headers = []) use ($bag): array {
            $bag->calls[] = ["method" => $method, "url" => $url, "body" => $body, "token" => $token, "headers" => $headers];
            $response = array_shift($bag->queue);
            $this->assertNotNull($response, "queue exhausted on call #" . count($bag->calls));

            return ["status" => $response[0], "body" => $response[1], "headers" => $response[2] ?? []];
        };

        return [new CustdClient(self::BASE_URL, "admin-token", ["admin_http_client" => $transport]), $bag];
    }

    public function testSubjectExportSendsTheTenantAndTheArtifactScope(): void
    {
        [$client, $calls] = $this->client([
            [202, self::example("createSubjectExport")],
            [200, self::example("downloadSubjectExport")],
            [202, self::example("forceSubjectExport")],
        ]);
        $exports = $client->adminSubjectExports();

        $exports->create(new SubjectExportCreateRequest("idem-1", "subject-1", SubjectExportScope::BOTH), "acme");
        $artifact = $exports->download(self::REQUEST, SubjectExportScope::ACCESS, "acme");
        $exports->force(self::REQUEST, "acme");

        $this->assertSame(["idempotencyKey" => "idem-1", "opaqueSubjectId" => "subject-1", "scope" => "both"], $calls->calls[0]["body"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/subject-exports?companySlug=acme", $calls->calls[0]["url"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/subject-exports/" . self::REQUEST . "/download?scope=access&companySlug=acme", $calls->calls[1]["url"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/subject-exports/" . self::REQUEST . "/force?companySlug=acme", $calls->calls[2]["url"]);
        $this->assertSame("example", $artifact->objectKey);
    }

    public function testSubjectExportExpiredDownloadSurfacesGoneWithoutTheObjectKey(): void
    {
        [$client] = $this->client([[410, self::problem(410, "gone", "Gone", "subject export artifact expired; request a new export")]]);

        try {
            $client->adminSubjectExports()->download(self::REQUEST, SubjectExportScope::PORTABILITY);
            $this->fail("expected the expired download to be refused");
        } catch (AdminProblemException $err) {
            $this->assertSame(410, $err->status);
            $this->assertSame("gone", $err->problem->type);
            $this->assertStringContainsString("expired", $err->getMessage());
            $this->assertStringNotContainsString("s3://", $err->getMessage());
        }
    }

    public function testPrivacyErasureOfAnotherTenantSurfacesNotFound(): void
    {
        [$client, $calls] = $this->client([[404, self::problem(404, "not_found", "Not Found", "privacy erasure not found")]]);

        try {
            $client->adminPrivacyErasures()->get(self::REQUEST, "other-tenant");
            $this->fail("expected a cross-tenant read to be refused");
        } catch (AdminProblemException $err) {
            $this->assertSame(404, $err->status);
            $this->assertStringNotContainsString("other-tenant", $err->getMessage());
        }
        $this->assertSame(self::BASE_URL . "/api/v1/admin/privacy/erasures/" . self::REQUEST . "?companySlug=other-tenant", $calls->calls[0]["url"]);
    }

    public function testPrivacyErasureCreateSendsTheSelectorAndForceSurfacesTheSafeNextAction(): void
    {
        // The force handler answers 202 with the request and, when the force could not run, the bounded next step.
        $refused = (string) json_encode(["request" => null, "safe_next_action" => "cancel", "safe_next_action_code" => "request_not_forceable"], JSON_THROW_ON_ERROR);
        $forced = json_decode(self::example("getPrivacyErasure"), false, 512, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            [202, self::example("createPrivacyErasure")],
            [202, $refused],
            [202, (string) json_encode(["request" => $forced, "safe_next_action" => "", "safe_next_action_code" => ""], JSON_THROW_ON_ERROR)],
        ]);
        $erasures = $client->adminPrivacyErasures();

        $erasures->create(new PrivacyErasureCreateRequest("acme", false, "gdpr_erasure_request", "redaction-1", new PrivacyErasureSelector("userUuid", value: "user-1")));
        $notForceable = $erasures->force(self::REQUEST);
        $accepted = $erasures->force(self::REQUEST);

        $this->assertSame([
            "companySlug" => "acme", "forceNow" => false, "reason" => "gdpr_erasure_request", "redactionId" => "redaction-1",
            "selector" => ["type" => "userUuid", "value" => "user-1"],
        ], $calls->calls[0]["body"]);
        $this->assertNull($notForceable->request);
        $this->assertSame("cancel", $notForceable->safeNextAction);
        $this->assertSame("request_not_forceable", $notForceable->safeNextActionCode);
        $this->assertSame("example", $accepted->request?->requestUuid);
    }

    public function testRetentionLegalHoldIsSentAndSurfacedVerbatim(): void
    {
        $policy = json_decode(self::example("upsertRetentionPolicy"), true, 512, JSON_THROW_ON_ERROR);
        $policy["legalHold"] = true;
        $policy["legalHoldUntil"] = "2027-01-01T00:00:00Z";
        // Preview and apply share retention.RetentionRunPreview; runs are retention.RetentionRunsListResponse.
        $preview = [
            "perStore" => [[
                "store" => "raw_landing", "retentionClass" => "operational", "candidateCount" => 142,
                "estimatedAffected" => 120, "sampleSubjects" => null, "legalHoldCount" => 22,
            ]],
            "lastResult" => "preview", "safeNextAction" => "apply", "startedAt" => "2026-11-20T06:00:00Z",
            "completedAt" => "2026-11-20T06:00:01Z",
        ];
        $runs = ["runs" => [[
            "startAt" => "2026-11-19T06:00:00Z", "endAt" => "2026-11-19T06:00:05Z", "lastResult" => "applied",
            "lastAffectedCounts" => ["raw_landing" => 120], "auditId" => 7,
        ]], "nextOffset" => 1, "hasMore" => false];
        [$client, $calls] = $this->client([
            [200, (string) json_encode($policy, JSON_THROW_ON_ERROR)],
            [200, (string) json_encode($preview, JSON_THROW_ON_ERROR)],
            [200, (string) json_encode($runs, JSON_THROW_ON_ERROR)],
        ]);
        $retention = $client->adminRetention();

        $saved = $retention->upsert("acme", new RetentionPolicyUpsertRequest(
            legalHold: true,
            maxAgeSeconds: 7776000,
            precedence: 100,
            retentionClass: "raw",
            scope: "tenant",
            legalHoldReference: "case-42",
            legalHoldUntil: "2027-01-01T00:00:00Z",
        ));
        $estimate = $retention->preview("acme");
        $history = $retention->listRuns("acme", 50, 0);

        $this->assertTrue($calls->calls[0]["body"]["legalHold"] ?? false);
        $this->assertSame("case-42", $calls->calls[0]["body"]["legalHoldReference"] ?? null);
        $this->assertTrue($saved->legalHold);
        $this->assertSame("2027-01-01T00:00:00Z", $saved->legalHoldUntil);
        $this->assertSame(22, $estimate->perStore[0]->legalHoldCount);
        $this->assertSame(120, $estimate->perStore[0]->estimatedAffected);
        $this->assertSame([], $estimate->perStore[0]->sampleSubjects);
        $this->assertSame(["raw_landing" => 120], $history->runs[0]->lastAffectedCounts);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/retention/policies/acme/runs?limit=50&offset=0", $calls->calls[2]["url"]);
    }

    public function testRetentionSelectorlessScopeSurfacesTheServerRefusal(): void
    {
        $detail = "invalid retention policy: scope requires a durable selector and is not supported yet";
        [$client] = $this->client([[400, self::problem(400, "invalid", "Invalid Request", $detail)]]);

        try {
            $client->adminRetention()->upsert("acme", new RetentionPolicyUpsertRequest(false, 60, 100, "raw", "data_space"));
            $this->fail("expected the selectorless scope to be refused");
        } catch (AdminProblemException $err) {
            $this->assertSame(400, $err->status);
            $this->assertStringContainsString("durable selector", $err->getMessage());
        }
    }

    public function testOffboardingSendsTheIdempotencyKeyAndExecutesWithoutABody(): void
    {
        [$client, $calls] = $this->client([
            [201, self::example("requestOffboarding")],
            [200, self::example("executeOffboarding")],
        ]);
        $offboarding = $client->adminOffboarding();

        $offboarding->requestOffboarding(new OffboardingRequestBody("acme"), "offboarding-proof-1");
        $receipt = $offboarding->execute(self::REQUEST);

        $this->assertSame(["confirmation" => "acme"], $calls->calls[0]["body"]);
        $this->assertSame("offboarding-proof-1", $calls->calls[0]["headers"]["Idempotency-Key"]);
        $this->assertNull($calls->calls[1]["body"]);
        $this->assertSame("example", $receipt->waiver?->role);
    }

    public function testOffboardingDownloadVerifiesTheDeclaredChecksumAndSize(): void
    {
        $body = "custd offboarding export\n";
        [$client] = $this->client([[200, $body, ["Content-Length" => (string) strlen($body), "X-Checksum-SHA256" => hash("sha256", $body)]]]);

        $download = $client->adminOffboarding()->download(self::REQUEST);

        $this->assertSame($body, $download->bytes);
        $this->assertSame(hash("sha256", $body), $download->checksumSha256);
        $this->assertSame(strlen($body), $download->byteSize);
    }

    public function testOffboardingDownloadRejectsChecksumMismatch(): void
    {
        $body = "custd offboarding";
        [$client] = $this->client([[200, $body, [
            "Content-Length" => (string) strlen($body),
            "X-Checksum-SHA256" => hash("sha256", "other"),
        ]]]);

        $this->expectExceptionMessage("checksum mismatch");
        $client->adminOffboarding()->download(self::REQUEST);
    }

    public function testOffboardingDownloadRejectsDeclaredSizeAboveBound(): void
    {
        $body = "custd offboarding";
        [$client] = $this->client([[200, $body, [
            "Content-Length" => (string) (64 * 1024 * 1024 + 1),
            "X-Checksum-SHA256" => hash("sha256", $body),
        ]]]);

        $this->expectExceptionMessage("exceeds 64 MiB");
        $client->adminOffboarding()->download(self::REQUEST);
    }

    public function testOffboardingConfirmSurfacesErasureIncompleteSafeNextAction(): void
    {
        // offboarding.OffboardingWorkflowConflictResponse, written with 409 when confirm finds an unfinished erasure.
        $body = (string) json_encode([
            "error" => "subject erasure has not reached a terminal state",
            "code" => "erasure_incomplete",
            "safe_next_action" => "retry_erasure",
        ], JSON_THROW_ON_ERROR);
        [$client] = $this->client([[409, $body]]);

        try {
            $client->adminOffboarding()->confirmRequest(self::REQUEST);
            $this->fail("expected the erasure-incomplete refusal");
        } catch (AdminWorkflowException $err) {
            $this->assertStringContainsString("retry_erasure", $err->getMessage());
            $this->assertSame("erasure_incomplete", $err->workflowCode);
            $this->assertSame("retry_erasure", $err->safeNextAction);
        }
    }

    public function testOffboardingScheduleSendsEveryField(): void
    {
        [$client, $calls] = $this->client([[201, self::example("scheduleOffboarding")]]);

        $client->adminOffboarding()->schedule(new OffboardingScheduleRequest(
            effectiveAt: "2026-12-01T00:00:00Z",
            gracePeriodDays: 30,
            reason: "contract ended",
            tenantSlug: "acme",
        ));

        $this->assertEqualsCanonicalizing([
            "effectiveAt" => "2026-12-01T00:00:00Z", "gracePeriodDays" => 30, "reason" => "contract ended", "tenantSlug" => "acme",
        ], $calls->calls[0]["body"]);
    }

    /** example is an operation's maximal example body: every field the server sends. */
    private static function example(string $operationId): string
    {
        $example = json_decode(
            (string) file_get_contents(__DIR__ . "/../../../contract-fixtures/api/examples/{$operationId}.json"),
            false,
            512,
            JSON_THROW_ON_ERROR,
        );

        return (string) json_encode($example->maximal, JSON_THROW_ON_ERROR);
    }

    /** problem is the server's RFC 9457 body (apierr.Problem) for one refusal. */
    private static function problem(int $status, string $type, string $title, string $detail): string
    {
        return (string) json_encode([
            "type" => $type, "title" => $title, "status" => $status, "detail" => $detail,
            "retryability" => "none", "nextAction" => ["action" => "none"],
        ], JSON_THROW_ON_ERROR);
    }
}
