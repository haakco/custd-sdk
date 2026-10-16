<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalTarget;
use HaakCo\Custd\Admin\AuthProject\AudienceGrant;
use HaakCo\Custd\Admin\AuthProject\AudienceGrantRequest;
use HaakCo\Custd\Admin\AuthProject\PrincipalAudience;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuthProjectAudiencesTest extends TestCase
{
    private const BASE = 'http://localhost:8080/api/v1/admin/auth-projects/project%2F1/environments/env%2F1/principals/provider%2Fsubject/audiences';

    /**
     * @param array<string, mixed> $response
     * @param list<array<string, mixed>> $calls
     */
    private function client(array $response, array &$calls): CustdClient
    {
        return new CustdClient('http://localhost:8080', 'token', [
            'admin_http_client' => function (string $method, string $url, ?array $body, string $token, array $headers = []) use ($response, &$calls): array {
                $calls[] = compact('method', 'url', 'body', 'token', 'headers');

                return ['status' => 200, 'body' => json_encode($response, JSON_THROW_ON_ERROR)];
            },
        ]);
    }

    private function target(): ApplicationPrincipalTarget
    {
        return new ApplicationPrincipalTarget('project/1', 'env/1', 'dir/1', 'provider/subject');
    }

    public function testList(): void
    {
        $calls = [];
        $api = $this->client([
            'audienceEntitlementMode' => 'explicit_grants',
            'audiences' => [['audience' => 'app-web', 'granted' => true, 'managed' => true]],
        ], $calls)->adminAuthProjects();
        $result = $api->listPrincipalAudiences($this->target(), new RequestOptions(owningUserUuid: 'owner-1'));
        self::assertSame('explicit_grants', $result->audienceEntitlementMode);
        self::assertEquals([new PrincipalAudience('app-web', true, true)], $result->audiences);
        self::assertSame(self::BASE.'?directoryId=dir%2F1', $calls[0]['url']);
        self::assertSame('GET', $calls[0]['method']);
        self::assertNull($calls[0]['body']);
        self::assertSame('owner-1', $calls[0]['headers']['X-Custd-Owning-User-UUID']);
        self::assertArrayNotHasKey('Idempotency-Key', $calls[0]['headers']);
    }

    public function testGrantAndRevokeOnlyNamedAudienceWithoutReplacement(): void
    {
        foreach (['grant', 'revoke'] as $action) {
            $calls = [];
            $granted = $action === 'grant';
            $api = $this->client([
                'principalId' => 'principal-1', 'organisationId' => 'org-1',
                'audience' => 'app-web', 'granted' => $granted, 'managed' => true,
            ], $calls)->adminAuthProjects();
            $method = $action.'PrincipalAudience';
            $body = new AudienceGrantRequest('dir/1', 'app-web', 'org-1');
            foreach ([null, new RequestOptions(idempotencyKey: '   ')] as $options) {
                try {
                    $api->$method($this->target(), $body, $options);
                    self::fail('Accepted absent idempotency key');
                } catch (\InvalidArgumentException $error) {
                    self::assertStringContainsString('idempotency', $error->getMessage());
                }
            }
            self::assertCount(0, $calls);
            $result = $api->$method($this->target(), $body, new RequestOptions(owningUserUuid: 'owner-1', idempotencyKey: 'audience-key'));
            self::assertEquals(new AudienceGrant('principal-1', 'org-1', 'app-web', $granted, true), $result);
            self::assertSame(self::BASE.'/'.$action, $calls[0]['url']);
            self::assertSame('POST', $calls[0]['method']);
            self::assertSame(['directoryId' => 'dir/1', 'audience' => 'app-web', 'organisationId' => 'org-1'], $calls[0]['body']);
            self::assertSame('audience-key', $calls[0]['headers']['Idempotency-Key']);
            self::assertSame('owner-1', $calls[0]['headers']['X-Custd-Owning-User-UUID']);
        }
    }
}
