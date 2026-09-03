<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Admin\TimePlanClient;
use HaakCo\Custd\Admin\TimePlan\AnnotationSchema;
use HaakCo\Custd\Admin\TimePlan\AnnotationInput;
use HaakCo\Custd\Admin\TimePlan\CommandRequest;
use HaakCo\Custd\Admin\TimePlan\Definition;
use HaakCo\Custd\Admin\TimePlan\RunRequest;
use HaakCo\Custd\Admin\TimePlan\RedactionRequest;
use HaakCo\Custd\Admin\TimePlan\ThresholdCue;
use PHPUnit\Framework\TestCase;

final class AdminClientTest extends TestCase
{
    public function testDataLabelAdminRoutesVocabularyValuesAssignmentsAndCatalogue(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body) use (&$calls): array {
                $calls[] = [$method, str_replace("http://localhost:8080", "", $url), $body];
                if ($method === "GET" && str_ends_with($url, "/data-labels")) {
                    return ["status" => 200, "body" => '{"definitions":[]}'];
                }
                if ($method === "GET" && str_contains($url, "/catalogue")) {
                    return ["status" => 200, "body" => '{"catalogue":{"labels":[]},"assignments":[],"reportingPacks":[],"fingerprint":"sha256"}'];
                }
                if ($method === "GET" && str_ends_with($url, "/usage")) {
                    return ["status" => 200, "body" => '{"usage":[]}'];
                }
                if ($method === "GET" && str_ends_with($url, "/data-label-assignments")) {
                    return ["status" => 200, "body" => '{"eventTypeDefaults":[],"schemaFieldAssignments":[]}'];
                }
                return ["status" => 204, "body" => ""];
            },
        ]);
        $labels = $client->adminDataLabels();
        $create = ["key" => "app.plan", "displayName" => "Plan", "description" => "Plan", "allowedScopes" => ["event"], "sensitivity" => "internal", "intendedUse" => "Reporting", "synonyms" => [], "propagationPolicy" => "none"];
        $update = $create;
        unset($update["key"]);
        $labels->list(true);
        $labels->catalogue(true);
        $labels->get("definition/1", true);
        $labels->create($create);
        $labels->update("definition/1", $update);
        $labels->disable("definition/1");
        $labels->createValue("definition/1", ["value" => "paid", "displayName" => "Paid", "description" => "Paid"]);
        $labels->updateValue("value/1", ["displayName" => "Paid", "description" => "Updated"]);
        $labels->disableValue("value/1");
        $labels->listUsage();
        $labels->listAssignments();
        $labels->setEventTypeDefault("page/view", "definition/1", ["valueUuid" => "value-1"]);
        $labels->removeEventTypeDefault("page/view", "definition/1");
        $labels->setSchemaFieldAssignment("schema/1", ["fieldPath" => "/user/id", "definitionUuid" => "definition-1", "valueUuid" => "value-1"]);
        $labels->removeSchemaFieldAssignment("assignment/1");
        $this->assertSame([
            ["GET", "/api/v1/admin/data-labels?includeDisabled=true"], ["GET", "/api/v1/admin/data-labels/catalogue?includeDisabled=true"],
            ["GET", "/api/v1/admin/data-labels/definition%2F1?includeDisabled=true"],
            ["POST", "/api/v1/admin/data-labels"], ["PATCH", "/api/v1/admin/data-labels/definition%2F1"], ["POST", "/api/v1/admin/data-labels/definition%2F1/disable"],
            ["POST", "/api/v1/admin/data-labels/definition%2F1/values"], ["PATCH", "/api/v1/admin/data-label-values/value%2F1"], ["POST", "/api/v1/admin/data-label-values/value%2F1/disable"],
            ["GET", "/api/v1/admin/data-labels/usage"], ["GET", "/api/v1/admin/data-label-assignments"],
            ["PUT", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"], ["DELETE", "/api/v1/admin/event-types/page%2Fview/data-label-defaults/definition%2F1"],
            ["PUT", "/api/v1/admin/event-schemas/schema%2F1/field-data-labels"], ["DELETE", "/api/v1/admin/data-label-assignments/schema-fields/assignment%2F1"],
        ], array_map(static fn (array $call): array => [$call[0], $call[1]], $calls));
    }

    public function testTimePlanAdminRoutesKeepTenantScopeAndTypedLifecyclePaths(): void
    {
        $responses = [
            ["status" => 200, "body" => '{"plans":[{"uuid":"plan-1","planKey":"focus","name":"Focus","description":"","status":"ready","draftRevision":1,"definition":{"horizonMs":60000,"redistributionMode":"proportional_current","autoAdvance":false,"blocks":[]},"updatedAt":"2026-09-02T12:00:00Z"}]}'],
            ["status" => 200, "body" => '{"transitions":[{"uuid":"transition-1","runUuid":"run-1","streamVersion":1,"commandId":"command-1","type":"start_run","actorKind":"human","actorRef":"user-1","serverReceivedAt":"2026-09-02T12:00:00Z","currentStatus":"running","allocatorVersion":"largest-remainder.v1","schemaVersion":"time-plan.transition.v1","receipt":{"allocatorVersion":"","reason":"","summary":"","source":[],"result":[],"changes":[]}}]}'],
            ["status" => 201, "body" => '{"uuid":"annotation-1","runUuid":"run-1","type":"note","recordedAt":"2026-09-02T12:00:00Z","actorKind":"human","actorRef":"user-1"}'],
            ["status" => 204, "body" => ""],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body) use (&$responses, &$calls): array {
                $calls[] = [$method, $url, $body];
                return array_shift($responses);
            },
        ]);

        $plans = $client->adminTimePlans()->list("acme", 25);
        $history = $client->adminTimePlans()->history("acme", "run-1", 10);
        $annotation = $client->adminTimePlans()->createAnnotation("acme", "run-1", new AnnotationInput("note", text: "hello"));
        $client->adminTimePlans()->redactAnnotation(
            "acme",
            "run-1",
            "annotation-1",
            new RedactionRequest("privacy request"),
        );

        $this->assertSame("plan-1", $plans->plans[0]->uuid);
        $this->assertSame("start_run", $history->transitions[0]->type);
        $this->assertSame("annotation-1", $annotation->uuid);
        $this->assertSame([
            ["GET", "http://localhost:8080/api/v1/admin/time-plans?companySlug=acme&limit=25"],
            ["GET", "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/history?companySlug=acme&limit=10"],
            ["POST", "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations?companySlug=acme"],
            ["POST", "http://localhost:8080/api/v1/admin/time-plans/runs/run-1/annotations/annotation-1/redact?companySlug=acme"],
        ], array_map(static fn (array $call): array => [$call[0], $call[1]], $calls));
    }

    public function testTimePlanListRejectsLegacyBareArrayResponse(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => static fn (): array => [
                "status" => 200,
                "body" => '[{"uuid":"plan-1"}]',
            ],
        ]);

        $this->expectException(\UnexpectedValueException::class);
        $client->adminTimePlans()->list("acme");
    }

    public function testTimePlanCollectionReadsRejectMissingResponseBody(): void
    {
        $readers = [
            static fn (TimePlanClient $client): object => $client->list("acme"),
            static fn (TimePlanClient $client): object => $client->history("acme", "run-1"),
            static fn (TimePlanClient $client): object => $client->listAnnotations("acme", "run-1"),
        ];

        foreach ($readers as $reader) {
            $client = new CustdClient("http://localhost:8080", "admin-token", [
                "admin_http_client" => static fn (): array => ["status" => 200, "body" => ""],
            ]);
            $thrown = false;
            try {
                $reader($client->adminTimePlans());
            } catch (\UnexpectedValueException) {
                $thrown = true;
            }
            $this->assertTrue($thrown, "missing collection response body must be rejected");
        }
    }

    public function testTimePlanRequestDtosOmitUnsetOptionalTimestamps(): void
    {
        $run = (new RunRequest("plan-1"))->toPayload();
        $command = (new CommandRequest("command-1", "retry-1", 0, "start_run"))->toPayload();
        $annotation = (new AnnotationInput("note", text: "hello"))->toPayload();

        $this->assertSame(["planUuid" => "plan-1"], $run);
        $this->assertArrayNotHasKey("clientOccurredAt", $command);
        $this->assertArrayNotHasKey("boundaryEndsAt", $command);
        $this->assertArrayNotHasKey("scheduledStartsAt", $command);
        $this->assertArrayNotHasKey("scheduledEndsAt", $command);
        $this->assertArrayNotHasKey("dueDate", $annotation);
    }

    public function testTimePlanDefinitionUsesTypedNestedDtos(): void
    {
        $definition = new Definition(
            horizonMs: 60000,
            redistributionMode: "proportional_current",
            annotationSchema: new AnnotationSchema(["note"], ["text"]),
            thresholdCues: [new ThresholdCue(remainingMs: 5000, severity: "warning")],
            blocks: [],
        );

        $this->assertSame([
            "horizonMs" => 60000,
            "defaultStartsAt" => null,
            "defaultEndsAt" => null,
            "redistributionMode" => "proportional_current",
            "autoAdvance" => false,
            "annotationSchema" => ["allowedTypes" => ["note"], "fields" => ["text"]],
            "thresholdCues" => [["remainingMs" => 5000, "severity" => "warning"]],
            "blocks" => [],
        ], $definition->toPayload());
    }

    public function testTimePlanDefinitionRejectsDuplicateThresholdTriggers(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new Definition(
            horizonMs: 60000,
            thresholdCues: [
                new ThresholdCue(remainingMs: 5000, severity: "warning"),
                new ThresholdCue(remainingMs: 5000, severity: "critical"),
            ],
        );
    }

    public function testAdminTenantsCreateUsesAdminApi(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080/", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 201,
                    "body" => '{"slug":"acme","companyName":"Acme Inc","enabled":true}',
                ];
            },
        ]);

        $tenant = $client->adminTenants()->create(["slug" => "acme", "companyName" => "Acme Inc"]);

        $this->assertSame("acme", $tenant["slug"]);
        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/tenants", $calls[0]["url"]);
        $this->assertSame("admin-token", $calls[0]["token"]);
        $this->assertSame(["slug" => "acme", "companyName" => "Acme Inc"], $calls[0]["body"]);
    }

    public function testOAuthClientListDoesNotExposeClientSecret(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"],"clientSecret":"secret"}',
            ],
            [
                "status" => 200,
                "body" => '{"clients":[{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"]}]}',
            ],
        ];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function () use (&$responses): array {
                return array_shift($responses);
            },
        ]);

        $created = $client->adminOAuthClients()->create([
            "clientId" => "custd-acme",
            "companySlug" => "acme",
            "scopes" => ["events.write"],
        ]);
        $list = $client->adminOAuthClients()->list();

        $this->assertSame("secret", $created["clientSecret"]);
        $this->assertArrayNotHasKey("clientSecret", $list["clients"][0]);
    }

    public function testAdminSitesManageBrowserSites(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"siteUuid":"site-123","companySlug":"acme","name":"Docs","identityMode":"cookieless","allowedOrigins":["https://example.com"],"rateLimitPerMinute":600,"retentionDays":365,"writeKey":"site_pk_test"}',
            ],
            ["status" => 200, "body" => '{"writeKey":"site_pk_next"}'],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $created = $client->adminSites()->create([
            "companySlug" => "acme",
            "name" => "Docs",
            "identityMode" => "cookieless",
            "allowedOrigins" => ["https://example.com"],
        ]);
        $rotated = $client->adminSites()->rotateWriteKey("site-123");

        $this->assertSame("site_pk_test", $created["writeKey"]);
        $this->assertSame("site_pk_next", $rotated["writeKey"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/sites", $calls[0]["url"]);
    }

    public function testAdminSitesListGetDeleteDoNotExposeWriteKeys(): void
    {
        $site = [
            "siteUuid" => "site-123",
            "companySlug" => "acme",
            "name" => "Docs",
            "identityMode" => "cookieless",
            "allowedOrigins" => ["https://example.com"],
            "rateLimitPerMinute" => 600,
            "retentionDays" => 365,
            "enabled" => true,
            "writeKey" => "site_pk_should_not_leak",
        ];
        $responses = [
            ["status" => 200, "body" => json_encode(["sites" => [$site]], JSON_THROW_ON_ERROR)],
            ["status" => 200, "body" => json_encode($site, JSON_THROW_ON_ERROR)],
            ["status" => 204, "body" => ""],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $listed = $client->adminSites()->list();
        $got = $client->adminSites()->get("site-123");
        $client->adminSites()->delete("site-123");

        $this->assertArrayNotHasKey("writeKey", $listed["sites"][0]);
        $this->assertArrayNotHasKey("writeKey", $got);
        $this->assertSame([
            ["GET", "http://localhost:8080/api/v1/admin/sites"],
            ["GET", "http://localhost:8080/api/v1/admin/sites/site-123"],
            ["DELETE", "http://localhost:8080/api/v1/admin/sites/site-123"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }

    public function testAdminSchemasRegisterAndVersionSchemas(): void
    {
        $responses = [
            [
                "status" => 200,
                "body" => '{"schemas":[{"eventTypeSlug":"courib.delivery.created","version":"1.0.0"}]}',
            ],
            [
                "status" => 201,
                "body" => '{"eventTypeSlug":"courib.delivery.created","version":"1.0.0","jsonSchema":{"type":"object"}}',
            ],
            [
                "status" => 201,
                "body" => '{"eventTypeSlug":"courib.delivery.created","version":"1.1.0","jsonSchema":{"type":"object"}}',
            ],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $list = $client->adminSchemas()->list();
        $registered = $client->adminSchemas()->register([
            "eventTypeSlug" => "courib.delivery.created",
            "version" => "1.0.0",
            "jsonSchema" => ["type" => "object"],
        ]);
        $next = $client->adminSchemas()->createVersion("courib.delivery.created", [
            "version" => "1.1.0",
            "jsonSchema" => ["type" => "object"],
        ]);

        $this->assertSame("courib.delivery.created", $list["schemas"][0]["eventTypeSlug"]);
        $this->assertSame("1.0.0", $registered["version"]);
        $this->assertSame("1.1.0", $next["version"]);
        $this->assertSame([
            ["GET", "http://localhost:8080/api/v1/admin/schemas"],
            ["POST", "http://localhost:8080/api/v1/admin/schemas"],
            ["POST", "http://localhost:8080/api/v1/admin/schemas/courib.delivery.created/versions"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }

    public function testAdminMeasurementProjectsCreateUsesAdminApi(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 201,
                    "body" => '{"projectUuid":"project-123","projectCode":"checkout-runway","name":"Checkout Runway","kind":"deadline_forecast","status":"active"}',
                ];
            },
        ]);

        $project = $client->adminMeasurementProjects()->create([
            "projectCode" => "checkout-runway",
            "name" => "Checkout Runway",
            "kind" => "deadline_forecast",
            "series" => [[
                "seriesCode" => "checkout-completions",
                "name" => "Checkout completions",
                "unitSlug" => "count",
                "completionDirection" => "increase",
                "source" => "manual",
            ]],
            "target" => [
                "targetCode" => "release",
                "name" => "Release",
                "targetValue" => 100,
                "targetDate" => "2026-08-31T00:00:00Z",
                "state" => "active",
            ],
        ]);

        $this->assertSame("project-123", $project["projectUuid"]);
        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/measurement/projects", $calls[0]["url"]);
    }

    public function testAdminMeasurementPredictionsKeepCompanyScopeAndSourceArrays(): void
    {
        $responses = [
            ["status" => 201, "body" => '{"uuid":"definition-1","status":"draft"}'],
            ["status" => 200, "body" => '[{"uuid":"source-1","source_mode":"http_json"}]'],
            ["status" => 202, "body" => '{}'],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $definition = $client->adminMeasurementPredictions()->createDefinition("acme", [
            "definition_key" => "quota", "display_name" => "Quota",
        ]);
        $sources = $client->adminMeasurementPredictions()->listSignalSources("acme", 10, "next");
        $client->adminMeasurementPredictions()->runNow("acme", "definition-1", ["worker_id" => "proof"]);

        $this->assertSame("definition-1", $definition["uuid"]);
        $this->assertSame("source-1", $sources[0]["uuid"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/predictions/sources?companySlug=acme&pageSize=10&pageToken=next",
            $calls[1]["url"],
        );
    }

    public function testAdminMeasurementObservationBulkValidatesRowResults(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 202,
                    "body" => '{"importId":"import-123","accepted":1,"rejected":1,"results":[{"rowIndex":1,"success":true,"status":202,"observationUuid":"observation-123"},{"rowIndex":2,"success":false,"status":422,"type":"https://custd.dev/problems/measurement-invalid-observation","title":"Invalid measurement observation","detail":"observedAt must be an RFC3339 timestamp"}]}',
                ];
            },
        ]);

        $response = $client->adminMeasurementProjects()->submitObservations("checkout-runway", [
            "rows" => [
                $this->measurementObservation("2026-07-01T00:00:00Z"),
                $this->measurementObservation("not-a-timestamp"),
            ],
        ]);

        $this->assertSame(1, $response["accepted"]);
        $this->assertFalse($response["results"][1]["success"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:bulk",
            $calls[0]["url"],
        );
    }

    public function testAdminMeasurementCSVImportValidatesRowResults(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 202,
                    "body" => '{"importId":"import-456","accepted":1,"rejected":1,"results":[{"rowIndex":1,"success":true,"status":202,"observationUuid":"observation-456"},{"rowIndex":2,"success":false,"status":422,"type":"https://custd.dev/problems/measurement-invalid-observation","title":"Invalid measurement observation","detail":"value must be finite"}]}',
                ];
            },
        ]);

        $response = $client->adminMeasurementProjects()->importCSVString(
            "checkout-runway",
            "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n",
            2,
        );

        $this->assertSame(1, $response["rejected"]);
        $this->assertSame(["csv" => "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n"], $calls[0]["body"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:csv",
            $calls[0]["url"],
        );
    }

    public function testAdminMeasurementRejectsMismatchedResultCount(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => fn (): array => ["status" => 202, "body" => '{"results":[]}'],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("measurement result count 0 does not match submitted row count 1");

        $client->adminMeasurementProjects()->submitObservation(
            "checkout-runway",
            $this->measurementObservation("2026-07-01T00:00:00Z"),
        );
    }

    public function testAdminMeasurementRejectsSuccessfulRowWithoutObservationUuid(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => fn (): array => [
                "status" => 202,
                "body" => '{"results":[{"rowIndex":1,"success":true,"status":202}]}',
            ],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("measurement result 0 missing observationUuid");

        $client->adminMeasurementProjects()->submitObservation(
            "checkout-runway",
            $this->measurementObservation("2026-07-01T00:00:00Z"),
        );
    }

    public function testAdminErrorResponseSurfacesProblemDetail(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (): array {
                return [
                    "status" => 409,
                    "body" => '{"type":"conflict","title":"Conflict","status":409,'
                        . '"detail":"tenant slug already exists","code":"duplicate_slug"}',
                ];
            },
        ]);

        try {
            $client->adminTenants()->create(["slug" => "acme", "companyName" => "Acme Inc"]);
            $this->fail("expected RuntimeException on RFC 9457 admin error");
        } catch (\RuntimeException $err) {
            self::assertStringContainsString("tenant slug already exists", $err->getMessage());
            self::assertStringContainsString("status 409", $err->getMessage());
            self::assertStringContainsString("duplicate_slug", $err->getMessage());
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function measurementObservation(string $observedAt): array
    {
        return [
            "seriesUuid" => "checkout-completions",
            "observedAt" => $observedAt,
            "value" => 42,
        ];
    }
}
