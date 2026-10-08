<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalErasureRequest;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalTarget;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuthPrincipalLifecycleTest extends TestCase
{
    public function testMutationsUseEscapedTargetAndTypedReceipts(): void
    {
        $calls = [];
        $client = $this->client($calls)->adminAuthProjects();
        $target = new ApplicationPrincipalTarget('project/1', 'environment/1', 'directory/1', 'subject/1');
        $options = new RequestOptions(owningUserUuid: 'owner-1', idempotencyKey: 'operation-1');
        $suspended = $client->suspendPrincipal($target, $options);
        $restored = $client->restorePrincipal($target, $options);
        $erased = $client->erasePrincipal($target, new ApplicationPrincipalErasureRequest(confirm: true), $options);

        self::assertSame('principal-1', $suspended->principalId);
        self::assertSame(3, $suspended->sessionsRevoked);
        self::assertTrue($restored->replayed);
        self::assertFalse($erased->countsRecorded);
        self::assertSame(2, $erased->mappings);
        foreach (['suspend', 'restore', 'erase'] as $index => $action) {
            self::assertSame('POST', $calls[$index]['method']);
            self::assertSame('http://localhost:8080/api/v1/admin/auth-projects/project%2F1/environments/environment%2F1/directories/directory%2F1/principals/subject%2F1/'.$action, $calls[$index]['url']);
            self::assertSame('owner-1', $calls[$index]['headers']['X-Custd-Owning-User-UUID']);
            self::assertSame('operation-1', $calls[$index]['headers']['Idempotency-Key']);
        }
        self::assertNull($calls[0]['body']);
        self::assertNull($calls[1]['body']);
        self::assertSame(['confirm' => true], $calls[2]['body']);
    }

    public function testMutationKeysAreRequiredBeforeTransport(): void
    {
        $calls = [];
        $client = $this->client($calls)->adminAuthProjects();
        $target = new ApplicationPrincipalTarget('project', 'environment', 'directory', 'subject');
        foreach (['suspendPrincipal', 'restorePrincipal', 'erasePrincipal'] as $method) {
            try {
                if ($method === 'erasePrincipal') {
                    $client->erasePrincipal($target, new ApplicationPrincipalErasureRequest(confirm: true));
                } else {
                    $client->{$method}($target);
                }
                self::fail('missing idempotency key was accepted');
            } catch (\InvalidArgumentException $error) {
                self::assertStringContainsString('idempotency key', $error->getMessage());
            }
        }
        self::assertSame([], $calls);
    }

    /** @param list<array<string, mixed>> $calls */
    private function client(array &$calls): CustdClient
    {
        return new CustdClient('http://localhost:8080', 'admin-token', [
            'admin_http_client' => function (string $method, string $url, ?array $body, string $token, array $headers = []) use (&$calls): array {
                $calls[] = compact('method', 'url', 'body', 'token', 'headers');
                $receipt = [
                    'projectId' => 'project/1', 'environmentId' => 'environment/1', 'directoryId' => 'directory/1',
                    'principalId' => 'principal-1', 'enabled' => false, 'sessionsRevoked' => 3, 'revision' => 7, 'replayed' => true,
                    'status' => 'applied', 'invitations' => 1, 'magicLinks' => 1, 'memberships' => 1, 'mappings' => 2,
                    'profileValues' => 1, 'principals' => 1, 'countsRecorded' => false,
                ];

                return ['status' => 200, 'body' => json_encode($receipt, flags: JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
