<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Auth\ApplicationAuthorityRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class ApplicationAuthorityTest extends TestCase
{
    public function testUsesTheApplicationTokenAndParsesHttp200Denial(): void
    {
        $calls = [];
        $client = new CustdClient('https://api.example.com', 'platform-token-must-not-leak', [
            'admin_http_client' => static function ($method, $url, $body, $token, $headers) use (&$calls): array {
                $calls[] = compact('method', 'url', 'body', 'token', 'headers');
                return ['status' => 200, 'body' => '{"authorized":false,"reason":"authority_withdrawn"}'];
            },
        ]);

        $decision = $client->checkApplicationAuthority(new ApplicationAuthorityRequest('application-token'));

        self::assertFalse($decision->authorized);
        self::assertSame('authority_withdrawn', $decision->reason);
        self::assertSame([[
            'method' => 'POST',
            'url' => 'https://api.example.com/oauth/authority-check',
            'body' => ['accessToken' => 'application-token'],
            'token' => 'application-token',
            'headers' => [],
        ]], $calls);
    }

    public function testParsesPositiveEvidenceWithoutAnAdminOrOwningUserCredential(): void
    {
        $client = new CustdClient('https://api.example.com', 'application-token', [
            'admin_http_client' => static fn (): array => [
                'status' => 200,
                'body' => '{"authorized":true,"reason":"authorized"}',
            ],
        ]);

        self::assertTrue($client->checkApplicationAuthority(new ApplicationAuthorityRequest('application-token'))->authorized);
    }

    public function testMalformedSuccessCannotBecomePositiveEvidence(): void
    {
        $client = new CustdClient('https://api.example.com', 'application-token', [
            'admin_http_client' => static fn (): array => [
                'status' => 200,
                'body' => '{"authorized":"true","reason":"authorized"}',
            ],
        ]);

        $this->expectException(\UnexpectedValueException::class);
        $client->checkApplicationAuthority(new ApplicationAuthorityRequest('application-token'));
    }

    public function testRejectsAnEmptyApplicationTokenWithoutSending(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new ApplicationAuthorityRequest('');
    }
}
