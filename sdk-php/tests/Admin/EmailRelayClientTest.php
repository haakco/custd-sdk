<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests\Admin;

use HaakCo\Custd\Admin\EmailRelayClient;
use PHPUnit\Framework\TestCase;

final class EmailRelayClientTest extends TestCase
{
    /** A tenant on Custd's own relay has no relay of its own, which the server sends as relay null. */
    public function testReadsATenantOnCustdsRelayAsNoRelay(): void
    {
        $body = '{"effective":{"relay":"custd","fromAddress":"noreply@custd.com","fromDisplayName":"Custd",'
            . '"hasCredential":true},"relay":null}';
        $client = new EmailRelayClient('http://localhost:8080', 'token', static fn (): array => ['status' => 200, 'body' => $body]);

        $view = $client->get('acme');

        self::assertNull($view->relay);
        self::assertSame('custd', $view->effective->relay);
    }
}
