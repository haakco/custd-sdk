<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuditClient;
use HaakCo\Custd\Admin\TenantClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * An admin client outlives a single OAuth access token when a consumer keeps it
 * for its process lifetime. These tests pin the fix that reads the token before
 * every request instead of once at construction, and that a plain-string token
 * still behaves exactly as it did.
 */
final class AdminTokenProviderTest extends TestCase
{
    private const BASE_URL = 'http://localhost:8080';

    public function testAdminClientResolvesTokenProviderForEveryRequest(): void
    {
        $issued = 0;
        $sent = [];
        $transport = function (string $method, string $url, ?array $body, string $token) use (&$sent): array {
            $sent[] = $token;
            return ['status' => 200, 'body' => '{"tenants":[]}'];
        };
        $client = new TenantClient(
            self::BASE_URL,
            function () use (&$issued): string {
                $issued++;
                return "token-{$issued}";
            },
            $transport,
        );

        $client->list();
        $client->list();

        $this->assertSame(2, $issued);
        $this->assertSame(['token-1', 'token-2'], $sent);
    }

    public function testBinaryRequestResolvesTokenProviderForEveryRequest(): void
    {
        $issued = 0;
        $sent = [];
        $transport = function (string $method, string $url, ?array $body, string $token) use (&$sent): array {
            $sent[] = $token;
            return ['status' => 200, 'body' => "eventId\n", 'headers' => []];
        };
        $client = new AuditClient(
            self::BASE_URL,
            function () use (&$issued): string {
                $issued++;
                return "token-{$issued}";
            },
            $transport,
        );

        $client->exportEvents();
        $client->exportEvents();

        $this->assertSame(2, $issued);
        $this->assertSame(['token-1', 'token-2'], $sent);
    }

    public function testPlainStringTokenIsSentUnchangedOnEveryRequest(): void
    {
        $sent = [];
        $transport = function (string $method, string $url, ?array $body, string $token) use (&$sent): array {
            $sent[] = $token;
            return ['status' => 200, 'body' => '{"tenants":[]}'];
        };
        $client = new TenantClient(self::BASE_URL, 'admin-token', $transport);

        $client->list();
        $client->list();

        $this->assertSame(['admin-token', 'admin-token'], $sent);
    }

    /**
     * The observed defect: a client-credentials token with a 300s lifespan went
     * stale inside a held admin client, so later calls failed with 401. With
     * `expires_in` 0 the token endpoint is read on every request, which is what a
     * long-lived consumer needs.
     */
    public function testAdminFactoryRefreshesOauthTokenBetweenRequests(): void
    {
        $tokenRequests = 0;
        $sent = [];
        $client = new CustdClient(self::BASE_URL, null, [
            'oauth' => [
                'client_id' => 'operator',
                'client_secret' => 'secret',
                'token_url' => 'http://localhost:4444/oauth2/token',
                'transport' => function () use (&$tokenRequests): array {
                    $tokenRequests++;
                    return ['access_token' => "oauth-token-{$tokenRequests}", 'expires_in' => 0];
                },
            ],
            'admin_http_client' => function (string $method, string $url, ?array $body, string $token) use (&$sent): array {
                $sent[] = $token;
                return ['status' => 200, 'body' => '{"items":[]}'];
            },
        ]);

        $timings = $client->adminWorkflowTimings();
        $this->assertSame(0, $tokenRequests, 'the factory must not snapshot a token at construction');

        $timings->listDefinitions('acme');
        $timings->listDefinitions('acme');

        $this->assertSame(2, $tokenRequests);
        $this->assertSame(['oauth-token-1', 'oauth-token-2'], $sent);
    }
}
