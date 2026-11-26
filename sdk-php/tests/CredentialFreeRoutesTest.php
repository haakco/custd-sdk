<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\SiteDomain\PrivateUptimeReport;
use HaakCo\Custd\Admin\SiteDomain\SiteAIConsentRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIOwnerHandoff;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatOutcome;
use HaakCo\Custd\Admin\SiteDomain\SiteHeartbeatReport;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * The routes a monitor, a status-page reader or an AI settings owner reaches without a client credential:
 * each sends only its own credential, never the client's token.
 */
final class CredentialFreeRoutesTest extends TestCase
{
    private const BASE = 'http://localhost:8080';
    private const TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    public function testAnOwnerSessionCarriesItsCookieOriginAndBinding(): void
    {
        $answers = [
            ['status' => 303, 'body' => '', 'headers' => ['set-cookie' => '__Host-custd-site-ai-owner=handle-123; Path=/; Secure']],
            ['status' => 200, 'body' => json_encode(['tenantSlug' => 'acme', 'sessionBinding' => 'binding-9', 'settings' => self::settings()])],
            ['status' => 200, 'body' => json_encode(self::settings())],
        ];
        $session = self::client($calls, $answers)->publicReads()->redeemSiteAIOwnerHandoff(
            new SiteAIOwnerHandoff('code-1', self::BASE . '/api/v1/site-ai-owner/redeem'),
            'https://hub.example.com',
        );
        $session->setConsent(SiteAIConsentRequest::revoke());

        self::assertSame('handle-123', $session->handle);
        self::assertSame('binding-9', $session->binding());
        self::assertSame(['POST /redeem', 'GET /settings', 'PUT /consent'], array_map(
            static fn (array $call): string => $call['method'] . ' ' . substr($call['url'], strlen(self::BASE . '/api/v1/site-ai-owner')),
            $calls,
        ));
        self::assertSame('code=code-1', $calls[0]['body']);
        self::assertSame('https://hub.example.com', $calls[0]['headers']['Origin']);
        self::assertSame(['Cookie' => '__Host-custd-site-ai-owner=handle-123'], $calls[1]['headers']);
        self::assertSame('binding-9', $calls[2]['headers']['X-Custd-Site-AI-Session']);
        self::assertSame(self::BASE, $calls[2]['headers']['Origin']);
        self::assertSame(['', '', ''], array_column($calls, 'bearer'));
    }

    public function testARedeemWithoutTheSessionCookieIsRefused(): void
    {
        $this->expectExceptionMessage('custd: the AI owner redeem returned no session cookie');

        self::client($calls, [['status' => 303, 'body' => '', 'headers' => []]])->publicReads()->redeemSiteAIOwnerHandoff(
            new SiteAIOwnerHandoff('code-1', self::BASE . '/api/v1/site-ai-owner/redeem'),
            'https://hub.example.com',
        );
    }

    public function testAMonitorReportsWithItsWriteTokenToItsOwnPath(): void
    {
        $receipt = ['report' => ['scheduledFor' => '2026-01-01T00:00:00Z', 'outcome' => 'failed'], 'receivedAt' => '2026-01-01T00:00:05Z'];
        $reads = self::client($calls, [['status' => 200, 'body' => json_encode($receipt)], ['status' => 204, 'body' => '']])->publicReads();

        $accepted = $reads->submitSiteHeartbeat('/api/v1/site-heartbeat-reports/acme/m-1', self::TOKEN, new SiteHeartbeatReport('2026-01-01T00:00:00Z', SiteHeartbeatOutcome::Failed));
        $reads->submitPrivateUptime('/api/v1/site-private-uptime-reports/acme/m-1', self::TOKEN, new PrivateUptimeReport('r-1', '2026-01-01T00:00:00Z', 30, 503));

        self::assertSame(SiteHeartbeatOutcome::Failed, $accepted->report->outcome);
        self::assertSame(['scheduledFor' => '2026-01-01T00:00:00Z', 'outcome' => 'failed'], $calls[0]['body']);
        self::assertSame(['reportUuid' => 'r-1', 'observedAt' => '2026-01-01T00:00:00Z', 'responseMs' => 30, 'statusCode' => 503], $calls[1]['body']);
        self::assertSame([self::TOKEN, self::TOKEN], array_column($calls, 'bearer'));

        $this->expectExceptionMessage('custd: a monitor report needs its /api/v1/site-private-uptime-reports/<tenant>/<monitor> path');
        $reads->getPrivateUptimeWork('/api/v1/site-heartbeat-reports/acme/m-1', self::TOKEN);
    }

    /** @return array<string, mixed> */
    private static function settings(): array
    {
        return ['aiMode' => 'off', 'monthlyCapUsdMicros' => 0, 'keyConfigured' => false];
    }

    /**
     * @param list<array{method: string, url: string, body: mixed, bearer: string, headers: array<string, string>}>|null $calls
     * @param-out list<array{method: string, url: string, body: mixed, bearer: string, headers: array<string, string>}> $calls
     * @param list<array<string, mixed>> $answers
     */
    private static function client(?array &$calls, array $answers): CustdClient
    {
        $calls = [];
        $transport = static function (string $method, string $url, mixed $body, string $bearer, array $headers = []) use (&$calls, &$answers): array {
            $calls[] = ['method' => $method, 'url' => $url, 'body' => $body, 'bearer' => $bearer, 'headers' => $headers];

            return array_shift($answers) ?? ['status' => 500, 'body' => ''];
        };

        return new CustdClient(self::BASE, 'client-token', ['admin_http_client' => $transport]);
    }
}
