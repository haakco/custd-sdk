<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Covers opt-in (default-on) gzip request-body compression on the batch send
 * path. The custd ingest server decodes `Content-Encoding: gzip` on
 * `/api/v1/events/batch`, so the SDK gzips the serialized JSON body once it
 * crosses a size threshold and advertises the encoding.
 */
final class RequestCompressionTest extends TestCase
{
    /**
     * @return array{0:string, 1:array<int, string>}
     */
    private function compress(CustdClient $client, string $body): array
    {
        $method = new ReflectionMethod(CustdClient::class, "compressBatchBody");
        /** @var array{0:string, 1:array<int, string>} $result */
        $result = $method->invoke($client, $body);
        return $result;
    }

    public function testBodyAtOrAboveThresholdIsGzippedAndAdvertised(): void
    {
        $client = new CustdClient("http://localhost:8080", "token");
        $body = json_encode(["events" => array_fill(0, 50, ["k" => "value-padding"])], JSON_THROW_ON_ERROR);
        $this->assertGreaterThanOrEqual(1024, strlen($body), "fixture must exceed default threshold");

        [$sentBody, $headers] = $this->compress($client, $body);

        $this->assertContains("Content-Encoding: gzip", $headers);
        $this->assertNotSame($body, $sentBody, "body must be compressed");
        $this->assertSame(
            $body,
            gzdecode($sentBody),
            "gzipped bytes must decompress back to the exact original JSON"
        );
    }

    public function testBodyBelowThresholdIsSentRawWithoutEncodingHeader(): void
    {
        $client = new CustdClient("http://localhost:8080", "token");
        $body = json_encode(["events" => [["k" => "v"]]], JSON_THROW_ON_ERROR);
        $this->assertLessThan(1024, strlen($body), "fixture must be under default threshold");

        [$sentBody, $headers] = $this->compress($client, $body);

        $this->assertSame($body, $sentBody, "small body must be sent raw");
        $this->assertNotContains("Content-Encoding: gzip", $headers);
    }

    public function testCompressionDisabledSendsRawRegardlessOfSize(): void
    {
        $client = new CustdClient("http://localhost:8080", "token", [
            "compression" => ["enabled" => false],
        ]);
        $body = json_encode(["events" => array_fill(0, 50, ["k" => "value-padding"])], JSON_THROW_ON_ERROR);
        $this->assertGreaterThanOrEqual(1024, strlen($body), "fixture must exceed default threshold");

        [$sentBody, $headers] = $this->compress($client, $body);

        $this->assertSame($body, $sentBody, "disabled compression must send raw bytes");
        $this->assertNotContains("Content-Encoding: gzip", $headers);
    }

    public function testCustomThresholdControlsCompression(): void
    {
        $client = new CustdClient("http://localhost:8080", "token", [
            "compression" => ["threshold_bytes" => 4],
        ]);
        $body = '{"events":[]}';

        [$sentBody, $headers] = $this->compress($client, $body);

        $this->assertContains("Content-Encoding: gzip", $headers);
        $this->assertSame($body, gzdecode($sentBody));
    }
}
