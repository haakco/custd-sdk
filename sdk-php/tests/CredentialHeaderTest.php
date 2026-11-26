<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\App\AppItemRef;
use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Ingest\CleanupApproval;
use HaakCo\Custd\Ingest\CleanupJobCreateRequest;
use PHPUnit\Framework\TestCase;

/**
 * CredentialHeaderTest proves the headers the route conformance table cannot see: the hosted-app routes
 * never carry the operator credential, and only ingest-api's cleanup-job reads and cancel name the acting
 * company.
 */
final class CredentialHeaderTest extends TestCase
{
    public function testAppRoutesSendOnlyTheirOwnCredentials(): void
    {
        $calls = [];
        $client = self::client($calls, []);
        $items = $client->appItems('site_pk_app', 'https://app.example.com', static fn (): string => 'user-token');

        self::attempt(static fn () => $items->readItem('link-token'));
        self::attempt(static fn () => $items->readItem(new AppItemRef('item-1')));
        self::attempt(static fn () => $client->appItems('site_pk_app', 'https://app.example.com')->readItem('link-token'));
        self::attempt(static fn () => $client->appProfile('app-token')->read());

        self::assertSame(['link-token', '', 'link-token', 'app-token'], array_column($calls, 'token'));
        self::assertSame(
            ['X-Custd-Site-Key' => 'site_pk_app', 'Origin' => 'https://app.example.com', 'X-Custd-User-Token' => 'user-token'],
            $calls[0]['headers'],
        );
        self::assertSame('http://localhost:8080/api/v1/app/item?item=item-1', $calls[1]['url']);
        self::assertSame(['X-Custd-Site-Key' => 'site_pk_app', 'Origin' => 'https://app.example.com'], $calls[2]['headers']);
        self::assertSame([], $calls[3]['headers']);
    }

    public function testOnlyCleanupJobReadsAndCancelNameTheActingCompany(): void
    {
        $calls = [];
        $ingest = self::client($calls, ['acting_company_slug' => 'acme'])->ingestOperations();
        $job = new CleanupJobCreateRequest(approval: new CleanupApproval('ExpiresAt', 'Identity'), approvedS3Prefixes: [], mode: 'scoped', reason: 'test');

        self::attempt(static fn () => $ingest->listCleanupJobs());
        self::attempt(static fn () => $ingest->getCleanupJob('job-1'));
        self::attempt(static fn () => $ingest->getCleanupJobProof('job-1'));
        self::attempt(static fn () => $ingest->cancelCleanupJob('job-1'));
        self::attempt(static fn () => $ingest->createCleanupJob($job));
        self::attempt(static fn () => $ingest->listCleanupPlans());
        self::attempt(static fn () => $ingest->monitoringSummary());

        $acting = ['X-Custd-Effective-Company' => 'acme'];
        self::assertSame([$acting, $acting, $acting, $acting, [], [], []], array_column($calls, 'headers'));

        $unset = [];
        $plain = self::client($unset, [])->ingestOperations();
        self::attempt(static fn () => $plain->listCleanupJobs());
        self::assertSame([], $unset[0]['headers']);
    }

    /**
     * @param list<array{url: string, token: string, headers: array<string, string>}> $calls
     * @param array<string, mixed> $options
     */
    private static function client(array &$calls, array $options): CustdClient
    {
        $transport = static function (string $method, string $url, mixed $body, string $token, array $headers = []) use (&$calls): array {
            $calls[] = ['url' => $url, 'token' => $token, 'headers' => $headers];

            return ['status' => 200, 'body' => '{}'];
        };

        return new CustdClient('http://localhost:8080', 'operator-token', $options + ['admin_http_client' => $transport]);
    }

    /** attempt sends a request whose empty answer fails to decode; only the request matters here. */
    private static function attempt(\Closure $call): void
    {
        try {
            $call();
        } catch (\UnexpectedValueException) {
        }
    }
}
