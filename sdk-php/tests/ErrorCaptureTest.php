<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\ErrorTracking\CaptureOutcome;
use HaakCo\Custd\ErrorTracking\CaptureRequest;
use HaakCo\Custd\ErrorTracking\Client;
use HaakCo\Custd\ErrorTracking\Config;
use HaakCo\Custd\ErrorTracking\DeliveryRequest;
use PHPUnit\Framework\TestCase;

final class ErrorCaptureTest extends TestCase
{
    public function test_native_envelope_omits_messages_arguments_and_absolute_paths(): void
    {
        $delivery = null;
        $client = new Client(
            new Config('https://errors.example.test', 'site_pk_'.str_repeat('a', 48), 'test', 'awthy@1.0.14'),
            function (DeliveryRequest $request) use (&$delivery): int {
                $delivery = $request;

                return 200;
            },
        );
        $result = $client->captureException(new CaptureRequest(new \RuntimeException('password=do-not-send')));
        self::assertSame(CaptureOutcome::Accepted, $result->outcome);
        self::assertInstanceOf(DeliveryRequest::class, $delivery);
        self::assertSame('https://errors.example.test/api/v1/errors/api/1/envelope/', $delivery->url);
        [$header, $item, $event] = array_map(static fn (string $line): array => json_decode($line, true, flags: JSON_THROW_ON_ERROR), explode("\n", $delivery->body));
        self::assertSame(['type' => 'event'], $item);
        self::assertSame('custd.php', $event['sdk']['name']);
        self::assertSame('RuntimeException', $event['exception']['values'][0]['type']);
        self::assertSame($header['event_id'], $event['event_id']);
        foreach (['do-not-send', 'password', __DIR__, '"args"', '"value"', '"request"'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $delivery->body);
        }
    }

    public function test_transport_failure_is_isolated_and_capture_count_is_bounded(): void
    {
        $attempts = 0;
        $client = new Client(
            new Config('https://errors.example.test', 'site_pk_'.str_repeat('a', 48), 'test'),
            function (DeliveryRequest $request) use (&$attempts): int {
                $attempts++;
                throw new \RuntimeException('private transport response');
            }
        );
        for ($attempt = 0; $attempt < 20; $attempt++) {
            self::assertSame(CaptureOutcome::Unavailable, $client->captureException(new CaptureRequest(new \RuntimeException()))->outcome);
        }
        self::assertSame(CaptureOutcome::Limited, $client->captureException(new CaptureRequest(new \RuntimeException()))->outcome);
        self::assertSame(20, $attempts);
    }
}
