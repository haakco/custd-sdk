<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests\Admin;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class CampaignEmailRevisionClientTest extends TestCase
{
    public function testItRendersExactRevisionUsingTheExistingBearerTransport(): void
    {
        $revision = str_repeat('a', 64);
        $company = '2a849955-e9c2-476f-9cf0-131b9615616d';
        $client = new CustdClient('http://localhost:8080', 'render-credential', [
            'admin_http_client' => function (string $method, string $url, ?array $body, string $token) use ($revision, $company): array {
                self::assertSame('POST', $method);
                self::assertSame('http://localhost:8080/api/v1/admin/campaign-email-revisions/' . $revision . '/render', $url);
                self::assertSame('render-credential', $token);
                self::assertSame('{"slots":{}}', json_encode($body, JSON_THROW_ON_ERROR));

                return ['status' => 200, 'body' => json_encode([
                    'companyUuid' => $company,
                    'subject' => 'Welcome',
                    'html' => '<p>Welcome</p>',
                    'text' => 'Welcome',
                ], JSON_THROW_ON_ERROR)];
            },
        ]);

        $result = $client->adminCampaignEmailRevisions()->render($revision, []);

        self::assertSame($company, $result->companyUuid);
        self::assertSame('Welcome', $result->subject);
        self::assertSame('<p>Welcome</p>', $result->html);
        self::assertSame('Welcome', $result->text);
    }
}
