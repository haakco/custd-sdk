<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\ReportingPack\LogObservabilityBindings;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackSetupTemplateBindRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class ReportingPackSetupTest extends TestCase
{
    public function testListsSetupTemplatesLosslessly(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            'templates' => [
                [
                    'kind' => 'log_observability',
                    'displayName' => 'Log observability',
                    'definition' => $this->definition(),
                    'bindings' => [
                        ['key' => 'eventType', 'label' => 'Registered event type', 'required' => true],
                        ['key' => 'severityField', 'label' => 'Severity field', 'required' => true],
                        ['key' => 'resourceField', 'label' => 'Resource field', 'required' => true],
                    ],
                ],
            ],
        ], $calls);

        $response = $client->adminReportingPacks()->listSetupTemplates();

        self::assertSame('/api/v1/admin/reporting-packs/setup-templates', $calls[0]['url']);
        self::assertSame('GET', $calls[0]['method']);
        $template = $response->templates[0];
        self::assertSame('log_observability', $template->kind);
        // Every contracted field survives the decode; nothing is dropped.
        self::assertEquals($this->definition(), $template->definition->serialise());
        self::assertSame(['eventType', 'severityField', 'resourceField'], array_map(
            static fn ($binding): string => $binding->key,
            $template->bindings,
        ));
    }

    public function testBindsTypedLogObservabilityBindings(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(['kind' => 'log_observability', 'definition' => $this->definition()], $calls);

        $response = $client->adminReportingPacks()->bindSetupTemplate(
            'log_observability',
            new ReportingPackSetupTemplateBindRequest(new LogObservabilityBindings('e', 'severity', 'resource')),
        );

        self::assertSame('/api/v1/admin/reporting-packs/setup-templates/log_observability/bind', $calls[0]['url']);
        self::assertSame('POST', $calls[0]['method']);
        self::assertSame(
            ['bindings' => ['eventType' => 'e', 'severityField' => 'severity', 'resourceField' => 'resource']],
            $calls[0]['body'],
        );
        self::assertEquals($this->definition(), $response->definition->serialise());
    }

    public function testUnknownKindSurfacesTheBackendError(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(['title' => 'unknown setup template'], $calls, 400);
        $this->expectException(\RuntimeException::class);
        $client->adminReportingPacks()->bindSetupTemplate(
            'nope',
            new ReportingPackSetupTemplateBindRequest(new LogObservabilityBindings('e', 's', 'r')),
        );
    }

    public function testExistingCrudRouteUnchanged(): void
    {
        $calls = [];
        $this->clientWithResponse(['drafts' => []], $calls)->adminReportingPacks()->listDrafts();
        self::assertSame('/api/v1/admin/reporting-packs/drafts', $calls[0]['url']);
    }

    /**
     * @return array<string, mixed>
     */
    private function definition(): array
    {
        return [
            'key' => 'log_observability',
            'displayName' => 'Log observability',
            'owner' => 'platform',
            'version' => 1,
            'enabled' => true,
            'eventTypes' => ['log_observability_event'],
            'metrics' => [['key' => 'volume', 'label' => 'Log volume', 'kind' => 'count', 'calculation' => 'count']],
            'dimensions' => [['key' => 'severity', 'label' => 'Severity', 'selector' => 'payload.severity']],
            'templates' => [[
                'name' => 'overview', 'allowedMetrics' => [], 'sourceModes' => ['auto'], 'maxRows' => 250,
                'eventTypes' => [], 'aggregation' => 'count',
            ]],
            'rollupRules' => [[
                'family' => 'volume', 'metric' => 'volume', 'sourceEventType' => 'e', 'completenessRequired' => false,
                'dimensions' => [['slot' => 1, 'dimension' => 'severity', 'selector' => 'payload.severity']],
            ]],
            'dashboards' => [[
                'key' => 'log_observability', 'title' => 'Log observability', 'defaultRange' => '7d', 'refreshSeconds' => 60,
                'requiredScopes' => ['reporting:read'],
                'widgets' => [['key' => 'volume', 'title' => 'Log volume', 'kind' => 'time_series', 'template' => 'overview', 'metrics' => ['volume']]],
            ]],
            'exportFormats' => ['manifest'],
            'trust' => ['safeFields' => ['coverage.status'], 'redactionGuard' => ['email']],
            'proof' => ['key' => 'proof', 'templates' => [], 'safeMetadataFields' => [], 'forbiddenFields' => [], 'outputLayout' => 'summary'],
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $calls
     */
    private function clientWithResponse(mixed $response, array &$calls, int $status = 200): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response, $status): array {
                $calls[] = [
                    "method" => $method,
                    "url" => str_replace("http://localhost:8080", "", $url),
                    "body" => $body,
                    "token" => $token,
                ];

                return ["status" => $status, "body" => json_encode($response, JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
