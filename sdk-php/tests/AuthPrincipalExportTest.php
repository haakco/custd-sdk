<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject\ApplicationIdentityTraitsStatus;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalTarget;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuthPrincipalExportTest extends TestCase
{
    public function testExportKeepsAllIdentityStatusesAndJsonTypes(): void
    {
        $response = [
            'projectId' => 'project/1', 'environmentId' => 'environment/1', 'directoryId' => 'directory/1',
            'principalId' => 'principal-1', 'enabled' => true, 'createdAt' => '2026-10-08T00:00:00Z',
            'identities' => [
                ['providerIssuer' => 'store-one', 'providerSubject' => 'subject-one', 'traitsStatus' => 'included',
                    'traits' => [['name' => 'verified', 'value' => true], ['name' => 'preferences', 'value' => (object) ['nested' => ['plain', null, false, 2]]]]],
                ['providerIssuer' => 'store-two', 'providerSubject' => 'subject-two', 'traitsStatus' => 'incomplete', 'traits' => null],
            ],
            'memberships' => [], 'profileValues' => [],
        ];
        $calls = [];
        $client = new CustdClient('http://localhost:8080', 'admin-token', [
            'admin_http_client' => function (string $method, string $url, ?array $body, string $token, array $headers = []) use (&$calls, $response): array {
                $calls[] = compact('method', 'url', 'body', 'token', 'headers');

                return ['status' => 200, 'body' => json_encode($response, flags: JSON_THROW_ON_ERROR)];
            },
        ]);
        $target = new ApplicationPrincipalTarget('project/1', 'environment/1', 'directory/1', 'subject/1');
        $exported = $client->adminAuthProjects()->exportPrincipal($target, new RequestOptions(owningUserUuid: 'owner-1'));
        self::assertCount(2, $exported->identities);
        self::assertSame(ApplicationIdentityTraitsStatus::Included, $exported->identities[0]->traitsStatus);
        self::assertSame(ApplicationIdentityTraitsStatus::Incomplete, $exported->identities[1]->traitsStatus);
        self::assertTrue($exported->identities[0]->traits[0]->value);
        self::assertInstanceOf(\stdClass::class, $exported->identities[0]->traits[1]->value);
        self::assertSame(['plain', null, false, 2], $exported->identities[0]->traits[1]->value->nested);
        self::assertNull($exported->identities[1]->traits);
        self::assertSame('GET', $calls[0]['method']);
        self::assertSame('http://localhost:8080/api/v1/admin/auth-projects/project%2F1/environments/environment%2F1/directories/directory%2F1/principals/subject%2F1/export', $calls[0]['url']);
        self::assertSame('owner-1', $calls[0]['headers']['X-Custd-Owning-User-UUID']);
        self::assertNull($calls[0]['body']);
    }
}
