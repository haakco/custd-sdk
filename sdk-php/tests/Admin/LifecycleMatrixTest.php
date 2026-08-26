<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests\Admin;

use HaakCo\Custd\Admin\LifecycleFixtures;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * Per-namespace matrix tests for the client-data-lifecycle SDK parity.
 * Each test boots a fresh admin transport that returns a shared lifecycle
 * fixture, then asserts the SDK sent the right URL + method, decoded the
 * expected shape, and never echoed sensitive download URLs or subject
 * identifiers into surfaced error messages.
 */
final class LifecycleMatrixTest extends TestCase
{
    private const BASE_URL = "http://localhost:8080";
    private const ADMIN_TOKEN = "admin-token";

    /**
     * Build a client whose admin transport serves a fixed response queue.
     * Returns the client plus a mutable bag whose `calls` array records every
     * outbound admin request so tests can assert URL + method + body without
     * relying on global transport state.
     *
     * @param array<int, array{0: string, 1: string}> $queue
     * @return array{0: CustdClient, 1: object{calls: array<int, array{method:string, url:string, body:mixed, token:string, headers:array<string, string>}>}}
     */
    private function client(array $queue): array
    {
        // Use an object to hold the calls array and the queue so the closure
        // can mutate both and the caller observes the same references after
        // the call. PHP captures closure variables by value by default, so
        // an object wrapper is required to keep the state shared across
        // closure invocations.
        $bag = new class () {
            /** @var array<int, array{method:string, url:string, body:mixed, token:string, headers:array<string, string>}> */
            public array $calls = [];
            /** @var array<int, array{0: string, 1: string}> */
            public array $queue = [];
        };
        $bag->queue = array_values($queue);
        $transport = function (
            string $method,
            string $url,
            ?array $body,
            string $token,
            array $headers = [],
        ) use ($bag): array {
            $bag->calls[] = [
                "method" => $method,
                "url" => $url,
                "body" => $body,
                "token" => $token,
                "headers" => $headers,
            ];
            $response = array_shift($bag->queue);
            $this->assertNotNull($response, "queue exhausted on call #" . count($bag->calls));
            return [
                "status" => (int) $response[0],
                "body" => $response[1],
            ];
        };

        $client = new CustdClient(self::BASE_URL, self::ADMIN_TOKEN, [
            "admin_http_client" => $transport,
        ]);
        return [$client, $bag];
    }

    public function testTenantStorageListDecodesLocationsAndHitsTenantScopedPath(): void
    {
        $fixture = LifecycleFixtures::load("tenant-storage", "valid-list-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $list = $client->adminTenantStorage()->list();

        $this->assertCount(2, $list["locations"]);
        $this->assertSame("loc_acme_warehouse", $list["locations"][0]["id"]);
        $this->assertSame("acme", $list["locations"][0]["tenantSlug"]);
        $this->assertSame("raw/acme/2026-07-31/", $list["locations"][0]["serverAssignedPrefix"]);
        $this->assertSame("active", $list["locations"][0]["status"]);
        $this->assertSame("GET", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/tenant-storage-locations", $calls->calls[0]["url"]);
        $this->assertNull($calls->calls[0]["body"]);
    }

    public function testTenantStorageListReturnsEmptyForCrossTenantScope(): void
    {
        $fixture = LifecycleFixtures::load("tenant-storage", "isolation-other-tenant-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["200", $body]]);

        $list = $client->adminTenantStorage()->list();

        $this->assertSame([], $list["locations"]);
    }

    public function testTenantStorageCreatePostsClientLocationAndDecodesServerAssignedPrefix(): void
    {
        $requestFixture = LifecycleFixtures::load("tenant-storage", "valid-create-request.json");
        $responseFixture = LifecycleFixtures::load("tenant-storage", "valid-create-response.json");
        $body = (string) json_encode($responseFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["201", $body]]);

        $created = $client->adminTenantStorage()->create($requestFixture);

        $this->assertSame("loc_acme_warehouse", $created["id"]);
        $this->assertSame("raw/acme/2026-07-31/", $created["serverAssignedPrefix"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/tenant-storage-locations", $calls->calls[0]["url"]);
        $this->assertSame($requestFixture, $calls->calls[0]["body"]);
    }

    public function testTenantStorageGetDecodesPerLocationRow(): void
    {
        $fixture = LifecycleFixtures::load("tenant-storage", "valid-get-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $row = $client->adminTenantStorage()->get("loc_acme_warehouse");

        $this->assertSame("loc_acme_warehouse", $row["id"]);
        $this->assertSame("active", $row["status"]);
        $this->assertSame("GET", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/tenant-storage-locations/loc_acme_warehouse", $calls->calls[0]["url"]);
    }

    public function testTenantStorageRevokeIssuesDeleteAndReturnsNoBody(): void
    {
        [$client, $calls] = $this->client([["204", ""]]);

        $client->adminTenantStorage()->revoke("loc_acme_warehouse");

        $this->assertSame("DELETE", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/tenant-storage-locations/loc_acme_warehouse", $calls->calls[0]["url"]);
    }

    public function testSubjectExportCreateAndForceDecodeReceipts(): void
    {
        $createRequest = LifecycleFixtures::load("subject-exports", "valid-create-request.json");
        $createResponse = LifecycleFixtures::load("subject-exports", "valid-create-response.json");
        $forceResponse = LifecycleFixtures::load("subject-exports", "valid-force-response.json");
        $createBody = (string) json_encode($createResponse, JSON_THROW_ON_ERROR);
        $forceBody = (string) json_encode($forceResponse, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["201", $createBody],
            ["200", $forceBody],
        ]);

        $created = $client->adminSubjectExports()->create($createRequest);
        $this->assertSame("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $created["requestId"]);
        $this->assertSame("queued", $created["state"]);
        $this->assertSame("userUuid", $created["subject"]["type"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/subject-exports", $calls->calls[0]["url"]);

        $forced = $client->adminSubjectExports()->force("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("ready", $forced["state"]);
        $this->assertSame("POST", $calls->calls[1]["method"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/force",
            $calls->calls[1]["url"],
        );
    }

    public function testSubjectExportDownloadSurfacesSignedUrlWithoutLoggingIt(): void
    {
        $fixture = LifecycleFixtures::load("subject-exports", "valid-download-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $download = $client->adminSubjectExports()->download("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

        $this->assertSame("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $download["requestId"]);
        $this->assertIsString($download["downloadUrl"]);
        $this->assertNotSame("", $download["downloadUrl"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/download",
            $calls->calls[0]["url"],
        );
        // The signed URL value must not leak into the outbound request URL.
        $this->assertStringNotContainsString("signed.example.invalid", $calls->calls[0]["url"]);
    }

    public function testSubjectExportExpiredDownloadSurfacesErrorWithoutLeakingSignedUrl(): void
    {
        $fixture = LifecycleFixtures::load("subject-exports", "expired-download-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["410", $body]]);

        try {
            $client->adminSubjectExports()->download("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
            $this->fail("expected RuntimeException on expired subject export download");
        } catch (\RuntimeException $err) {
            $this->assertStringContainsString("download_expired", $err->getMessage());
            $this->assertStringNotContainsString(
                "signed.example.invalid",
                $err->getMessage(),
                "signed URL value must not appear in surfaced error message",
            );
        }
    }

    public function testSubjectExportListAndCancelAndGet(): void
    {
        $listFixture = LifecycleFixtures::load("subject-exports", "valid-list-response.json");
        $cancelFixture = LifecycleFixtures::load("subject-exports", "valid-cancel-response.json");
        $getFixture = LifecycleFixtures::load("subject-exports", "valid-get-response.json");
        $listBody = (string) json_encode($listFixture, JSON_THROW_ON_ERROR);
        $cancelBody = (string) json_encode($cancelFixture, JSON_THROW_ON_ERROR);
        $getBody = (string) json_encode($getFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["200", $listBody],
            ["200", $cancelBody],
            ["200", $getBody],
        ]);

        $list = $client->adminSubjectExports()->list();
        $this->assertCount(1, $list["exports"]);
        $this->assertSame("GET", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/subject-exports", $calls->calls[0]["url"]);

        $cancelled = $client->adminSubjectExports()->cancel("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("cancelled", $cancelled["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/cancel",
            $calls->calls[1]["url"],
        );

        $row = $client->adminSubjectExports()->get("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $row["requestId"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/subject-exports/se_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
            $calls->calls[2]["url"],
        );
    }

    public function testPrivacyErasureCreateAndGetDecodePerStoreProgress(): void
    {
        $createResponse = LifecycleFixtures::load("privacy-erasures", "valid-create-response.json");
        $getResponse = LifecycleFixtures::load("privacy-erasures", "valid-get-response.json");
        $createBody = (string) json_encode($createResponse, JSON_THROW_ON_ERROR);
        $getBody = (string) json_encode($getResponse, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["201", $createBody],
            ["200", $getBody],
        ]);

        $created = $client->adminPrivacyErasures()->create([
            "tenantSlug" => "acme",
            "selector" => ["type" => "userUuid", "value" => "01J5K7N4Y8X9Z2B6V3D1M0Q7RJ"],
            "reason" => "gdpr_erasure_request",
        ]);
        $this->assertSame("pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $created["requestUuid"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/privacy/erasures", $calls->calls[0]["url"]);

        $got = $client->adminPrivacyErasures()->get("pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("complete", $got["state"]);
        $this->assertCount(5, $got["perStoreProgress"]);
        foreach ($got["perStoreProgress"] as $row) {
            $this->assertNotSame("", $row["store"]);
            $this->assertNotSame("", $row["state"]);
        }
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/privacy/erasures/pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
            $calls->calls[1]["url"],
        );
    }

    public function testPrivacyErasureListReturnsEmptyForCrossTenantScope(): void
    {
        $fixture = LifecycleFixtures::load("privacy-erasures", "isolation-other-tenant.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["200", $body]]);

        $list = $client->adminPrivacyErasures()->list();

        $this->assertSame([], $list["erasures"]);
    }

    public function testPrivacyErasureLegalHoldSurfacesRetainedStoreVerbatim(): void
    {
        $fixture = LifecycleFixtures::load("privacy-erasures", "legal-hold-retained.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["200", $body]]);

        $got = $client->adminPrivacyErasures()->get("pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

        $this->assertSame("partial", $got["state"]);
        $legalHold = null;
        foreach ($got["perStoreProgress"] as $row) {
            if ($row["store"] === "legal_hold") {
                $legalHold = $row;
                break;
            }
        }
        $this->assertNotNull($legalHold);
        $this->assertSame("retained", $legalHold["state"]);
        $this->assertSame(0, $legalHold["deletedCount"]);
        $this->assertSame("legal_hold", $legalHold["reason"]);
    }

    public function testPrivacyErasureForceReturnsFencingState(): void
    {
        $fixture = LifecycleFixtures::load("privacy-erasures", "valid-force-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $forced = $client->adminPrivacyErasures()->force("pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

        $this->assertSame("fencing", $forced["state"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/privacy/erasures/pe_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/force",
            $calls->calls[0]["url"],
        );
    }

    public function testRetentionListAndGetDecodePolicies(): void
    {
        $listFixture = LifecycleFixtures::load("retention", "valid-list-response.json");
        $getFixture = LifecycleFixtures::load("retention", "valid-get-response.json");
        $listBody = (string) json_encode($listFixture, JSON_THROW_ON_ERROR);
        $getBody = (string) json_encode($getFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["200", $listBody],
            ["200", $getBody],
        ]);

        $list = $client->adminRetention()->list();
        $this->assertCount(1, $list["policies"]);
        $this->assertSame("acme", $list["policies"][0]["tenantSlug"]);
        $this->assertSame("operational", $list["policies"][0]["retentionClass"]);
        $this->assertSame(2592000, $list["policies"][0]["maxAgeSeconds"]);
        $this->assertSame(100, $list["policies"][0]["precedence"]);
        $this->assertFalse($list["policies"][0]["legalHold"]);
        $this->assertSame("GET", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/retention/policies", $calls->calls[0]["url"]);

        $row = $client->adminRetention()->get("acme");
        $this->assertCount(2, $row["policies"]);
        $this->assertSame("operational", $row["policies"][0]["retentionClass"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/retention/policies/acme",
            $calls->calls[1]["url"],
        );
    }

    public function testRetentionUpsertPutsScopeAndServerEchoesValues(): void
    {
        $requestFixture = LifecycleFixtures::load("retention", "valid-upsert-request.json");
        $responseFixture = LifecycleFixtures::load("retention", "valid-upsert-response.json");
        $body = (string) json_encode($responseFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $row = $client->adminRetention()->upsert("acme", $requestFixture);

        $this->assertSame("acme", $row["tenantSlug"]);
        $this->assertSame("operational", $row["retentionClass"]);
        $this->assertSame(7776000, $row["maxAgeSeconds"]);
        $this->assertSame("PUT", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/retention/policies/acme", $calls->calls[0]["url"]);
        $this->assertSame($requestFixture, $calls->calls[0]["body"]);
    }

    public function testRetentionUpsertSurfacesSelectorRequiredError(): void
    {
        $fixture = LifecycleFixtures::load("retention", "invalid-selectorless-scope.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["400", $body]]);

        try {
            $client->adminRetention()->upsert("acme", [
                "scope" => "data_space",
                "retentionClass" => "operational",
                "maxAgeSeconds" => 60,
                "precedence" => 100,
                "legalHold" => false,
            ]);
            $this->fail("expected RuntimeException on selector-required error");
        } catch (\RuntimeException $err) {
            $this->assertNotSame("", $err->getMessage());
        }
    }

    public function testRetentionDeleteReturnsNoBody(): void
    {
        [$client, $calls] = $this->client([["204", ""]]);

        $client->adminRetention()->delete("acme");

        $this->assertSame("DELETE", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/retention/policies/acme", $calls->calls[0]["url"]);
    }

    public function testRetentionPreviewApplyAndListRunsSurfaceServerCounts(): void
    {
        $previewFixture = LifecycleFixtures::load("retention", "valid-preview-response.json");
        $applyFixture = LifecycleFixtures::load("retention", "valid-apply-response.json");
        $runsFixture = LifecycleFixtures::load("retention", "valid-runs-response.json");
        $previewBody = (string) json_encode($previewFixture, JSON_THROW_ON_ERROR);
        $applyBody = (string) json_encode($applyFixture, JSON_THROW_ON_ERROR);
        $runsBody = (string) json_encode($runsFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["200", $previewBody],
            ["200", $applyBody],
            ["200", $runsBody],
        ]);

        $preview = $client->adminRetention()->preview("acme");
        $this->assertNotSame("", $preview["previewId"]);
        $this->assertCount(3, $preview["estimatedDeletions"]);
        $this->assertSame("raw_landing", $preview["estimatedDeletions"][0]["store"]);
        $this->assertSame(142, $preview["estimatedDeletions"][0]["count"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/retention/policies/acme/preview", $calls->calls[0]["url"]);

        $applied = $client->adminRetention()->apply("acme");
        $this->assertNotSame("", $applied["runId"]);
        $this->assertSame("running", $applied["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/retention/policies/acme/apply",
            $calls->calls[1]["url"],
        );

        $runs = $client->adminRetention()->listRuns("acme");
        $this->assertCount(2, $runs["runs"]);
        $this->assertSame("complete", $runs["runs"][0]["state"]);
        $this->assertSame(172, $runs["runs"][0]["deletedCount"]);
        $this->assertSame("running", $runs["runs"][1]["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/retention/policies/acme/runs",
            $calls->calls[2]["url"],
        );
    }

    public function testOffboardingFullLifecycleHitsEveryEndpointAndSurfacesReceipt(): void
    {
        $createFixture = LifecycleFixtures::load("offboarding", "valid-request-create-response.json");
        $previewFixture = LifecycleFixtures::load("offboarding", "valid-preview-response.json");
        $exportFixture = LifecycleFixtures::load("offboarding", "valid-export-response.json");
        $downloadFixture = LifecycleFixtures::load("offboarding", "valid-download-response.json");
        $ackFixture = LifecycleFixtures::load("offboarding", "valid-acknowledge-response.json");
        $execFixture = LifecycleFixtures::load("offboarding", "valid-execute-response.json");
        $receiptFixture = LifecycleFixtures::load("offboarding", "valid-receipt-response.json");

        $createBody = (string) json_encode($createFixture, JSON_THROW_ON_ERROR);
        $previewBody = (string) json_encode($previewFixture, JSON_THROW_ON_ERROR);
        $exportBody = (string) json_encode($exportFixture, JSON_THROW_ON_ERROR);
        $downloadBody = (string) json_encode($downloadFixture, JSON_THROW_ON_ERROR);
        $ackBody = (string) json_encode($ackFixture, JSON_THROW_ON_ERROR);
        $execBody = (string) json_encode($execFixture, JSON_THROW_ON_ERROR);
        $receiptBody = (string) json_encode($receiptFixture, JSON_THROW_ON_ERROR);

        [$client, $calls] = $this->client([
            ["201", $createBody],
            ["200", $previewBody],
            ["200", $exportBody],
            ["200", $downloadBody],
            ["200", $ackBody],
            ["200", $execBody],
            ["200", $receiptBody],
        ]);

        $created = $client->adminOffboarding()->requestOffboarding(
            ["confirmation" => "acme"],
            ["idempotencyKey" => "tiao-offboarding-proof-1"],
        );
        $this->assertSame("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $created["requestUuid"]);
        $this->assertSame("preview", $created["state"]);
        $this->assertSame("POST", $calls->calls[0]["method"]);
        $this->assertSame(self::BASE_URL . "/api/v1/admin/offboarding", $calls->calls[0]["url"]);
        $this->assertSame(["confirmation" => "acme"], $calls->calls[0]["body"]);
        $this->assertSame("tiao-offboarding-proof-1", $calls->calls[0]["headers"]["Idempotency-Key"]);

        $preview = $client->adminOffboarding()->preview("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertNotSame("", $preview["previewInventoryDigest"]);
        $this->assertCount(3, $preview["stores"]);
        $this->assertSame("operational", $preview["stores"][0]["retentionClass"]);
        $this->assertSame(1247, $preview["stores"][0]["estimatedCount"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/preview",
            $calls->calls[1]["url"],
        );

        $exportReceipt = $client->adminOffboarding()->export("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame(1357, $exportReceipt["recordCount"]);
        $this->assertNotSame("", $exportReceipt["checksumSha256"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/export",
            $calls->calls[2]["url"],
        );

        $download = $client->adminOffboarding()->download("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertIsString($download["downloadUrl"]);
        $this->assertNotSame("", $download["downloadUrl"]);
        // The signed URL value must not leak into the outbound request URL.
        $this->assertStringNotContainsString("signed.example.invalid", $calls->calls[3]["url"]);

        $ack = $client->adminOffboarding()->acknowledge("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("requested", $ack["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/acknowledge",
            $calls->calls[4]["url"],
        );

        $exec = $client->adminOffboarding()->execute("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", [
            "waiver" => [
                "role" => "client_owner",
                "reason" => "explicit_client_request",
            ],
        ]);
        $this->assertSame([
            "waiver_role" => "client_owner",
            "waiver_reason" => "explicit_client_request",
        ], $calls->calls[5]["body"]);
        $this->assertSame("complete", $exec["finalState"]);
        $this->assertSame("client_owner", $exec["waiver"]["role"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/execute",
            $calls->calls[5]["url"],
        );

        $receipt = $client->adminOffboarding()->receipt("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("complete", $receipt["finalState"]);
        $this->assertSame("user:u_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", $receipt["requestedByActor"]);
        $this->assertSame(7, $receipt["requestedByUserId"]);
        $this->assertNotSame("", $receipt["sha256"]);
        $this->assertCount(3, $receipt["perStore"]);
        foreach ($receipt["perStore"] as $row) {
            $this->assertNotSame("", $row["store"]);
            $this->assertNotSame("", $row["retentionClass"]);
        }
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/receipt",
            $calls->calls[6]["url"],
        );
    }

    public function testOffboardingConfirmAndCancelAndGetRequest(): void
    {
        $getFixture = LifecycleFixtures::load("offboarding", "valid-request-get-response.json");
        $confirmFixture = LifecycleFixtures::load("offboarding", "valid-confirm-response.json");
        $cancelFixture = LifecycleFixtures::load("offboarding", "valid-cancel-response.json");
        $getBody = (string) json_encode($getFixture, JSON_THROW_ON_ERROR);
        $confirmBody = (string) json_encode($confirmFixture, JSON_THROW_ON_ERROR);
        $cancelBody = (string) json_encode($cancelFixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["200", $getBody],
            ["200", $confirmBody],
            ["200", $cancelBody],
        ]);

        $row = $client->adminOffboarding()->getRequest("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("exported", $row["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
            $calls->calls[0]["url"],
        );

        $confirmed = $client->adminOffboarding()->confirmRequest("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
        $this->assertSame("confirmed", $confirmed["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/confirm",
            $calls->calls[1]["url"],
        );

        $cancelled = $client->adminOffboarding()->cancelRequest(
            "ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ",
            ["reason" => "client_request_cancelled"],
        );
        $this->assertSame("cancelled", $cancelled["state"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/cancel",
            $calls->calls[2]["url"],
        );
        $this->assertSame(["reason" => "client_request_cancelled"], $calls->calls[2]["body"]);
    }

    public function testOffboardingExecuteSurfacesWaiverRequiredError(): void
    {
        $fixture = LifecycleFixtures::load("offboarding", "invalid-waiver-empty.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["400", $body]]);

        try {
            $client->adminOffboarding()->execute("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ", [
                "waiver" => ["role" => "", "reason" => ""],
            ]);
            $this->fail("expected RuntimeException on waiver-required error");
        } catch (\RuntimeException $err) {
            $msg = strtolower($err->getMessage());
            $this->assertStringContainsString("waiver", $msg);
        }
    }

    public function testOffboardingConfirmSurfacesErasureIncompleteSafeNextAction(): void
    {
        $fixture = LifecycleFixtures::load("offboarding", "incomplete-erasure-blocks-confirm.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client] = $this->client([["409", $body]]);

        try {
            $client->adminOffboarding()->confirmRequest("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");
            $this->fail("expected RuntimeException on erasure-incomplete error");
        } catch (\HaakCo\Custd\Admin\AdminWorkflowException $err) {
            $this->assertStringContainsString("retry_erasure", $err->getMessage());
            $this->assertSame("erasure_incomplete", $err->workflowCode);
            $this->assertSame("retry_erasure", $err->safeNextAction);
        }
    }

    public function testOffboardingRetryResponse(): void
    {
        $fixture = LifecycleFixtures::load("offboarding", "valid-retry-response.json");
        $body = (string) json_encode($fixture, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([["200", $body]]);

        $row = $client->adminOffboarding()->retry("ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ");

        $this->assertSame("complete", $row["finalState"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/requests/ob_01J5K7N4Y8X9Z2B6V3D1M0Q7RJ/retry",
            $calls->calls[0]["url"],
        );
    }

    public function testOffboardingScheduleListGetCreateAndCancel(): void
    {
        $createRequest = LifecycleFixtures::load("offboarding", "valid-schedule-create-request.json");
        $createResponse = LifecycleFixtures::load("offboarding", "valid-schedule-create-response.json");
        $listResponse = LifecycleFixtures::load("offboarding", "valid-schedule-list-response.json");
        $createResponseBody = (string) json_encode($createResponse, JSON_THROW_ON_ERROR);
        $listBody = (string) json_encode($listResponse, JSON_THROW_ON_ERROR);
        [$client, $calls] = $this->client([
            ["201", $createResponseBody],
            ["200", $listBody],
            ["200", $createResponseBody],
            ["200", ""],
        ]);

        $created = $client->adminOffboarding()->schedule($createRequest);
        $this->assertSame("scheduled", $created["status"]);
        $this->assertSame($createRequest["effectiveAt"], $created["effectiveAt"]);
        $this->assertSame($createRequest["gracePeriodDays"], $created["gracePeriodDays"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/schedules",
            $calls->calls[0]["url"],
        );
        $this->assertSame($createRequest, $calls->calls[0]["body"]);

        $listed = $client->adminOffboarding()->listSchedules();
        $this->assertCount(1, $listed["schedules"]);
        $this->assertSame("acme", $listed["schedules"][0]["tenantSlug"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/schedules",
            $calls->calls[1]["url"],
        );

        $perTenant = $client->adminOffboarding()->getSchedule("acme");
        $this->assertSame("scheduled", $perTenant["status"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/schedules/acme",
            $calls->calls[2]["url"],
        );

        $client->adminOffboarding()->cancelSchedule("acme", ["reason" => "client_cancelled"]);
        $this->assertSame(
            self::BASE_URL . "/api/v1/admin/offboarding/schedules/acme/cancel",
            $calls->calls[3]["url"],
        );
        $this->assertSame(["reason" => "client_cancelled"], $calls->calls[3]["body"]);
    }
}
