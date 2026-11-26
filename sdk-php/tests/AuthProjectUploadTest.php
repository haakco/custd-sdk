<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/** The two auth-project uploads send their bytes as is, with the content type each route reads. */
final class AuthProjectUploadTest extends TestCase
{
    public function testUploadsSendRawBytesWithTheirContentType(): void
    {
        $calls = [];
        $responses = [
            '{"path":"assets/app.js","size":3,"sha256":"abc"}',
            '{"contentType":"image/png","updatedAt":"2026-11-26T00:00:00Z","byteSize":3,"width":1,"height":1}',
        ];
        $client = new CustdClient('http://localhost:8080', 'token', [
            'admin_http_client' => static function (string $method, string $url, mixed $body, string $token, array $headers) use (&$calls, &$responses): array {
                $calls[] = compact('url', 'body', 'headers');

                return ['status' => 200, 'body' => array_shift($responses)];
            },
        ]);

        $file = $client->adminAuthProjects()->releases()->uploadFile('p', 'e', 'r', 'assets/app.js', 'abc');
        $logo = $client->adminAuthProjects()->setEnvironmentBrandLogo('p', 'e', 'logo.png', 'png');

        self::assertSame('assets/app.js', $file->path);
        self::assertSame('image/png', $logo->contentType);
        self::assertSame('http://localhost:8080/api/v1/admin/auth-projects/p/environments/e/releases/r/files?path=assets%2Fapp.js', $calls[0]['url']);
        self::assertSame('abc', $calls[0]['body']);
        self::assertSame('application/octet-stream', $calls[0]['headers']['Content-Type']);
        self::assertMatchesRegularExpression('/^multipart\/form-data; boundary=(\S+)$/', $calls[1]['headers']['Content-Type']);
        self::assertStringContainsString("name=\"logo\"; filename=\"logo.png\"\r\nContent-Type: application/octet-stream\r\n\r\npng\r\n", $calls[1]['body']);
    }
}
