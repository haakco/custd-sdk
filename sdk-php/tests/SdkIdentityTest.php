<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\Http;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Custd learns which release a caller runs from the X-Custd-Sdk header, so a
 * consumer stuck on an old version becomes visible instead of being found by
 * grepping repositories. The header has to travel on ingest and admin requests
 * alike, and a wrapper must be distinguishable from raw PHP.
 */
final class SdkIdentityTest extends TestCase
{
    /** @return array<int, string> */
    private function ingestHeaders(CustdClient $client): array
    {
        $method = new ReflectionMethod(CustdClient::class, "requestHeaders");
        /** @var array<int, string> $headers */
        $headers = $method->invoke($client);

        return $headers;
    }

    /** @return array<int, string> */
    private function adminHeaders(string $token): array
    {
        $method = new ReflectionMethod(Http::class, "baseHeaders");
        /** @var array<int, string> $headers */
        $headers = $method->invoke(null, $token);

        return $headers;
    }

    public function testIngestRequestsIdentifyThePhpSdkAndItsVersion(): void
    {
        $client = new CustdClient("http://localhost:8080", "token");

        $this->assertContains("X-Custd-Sdk: php/" . CustdClient::VERSION, $this->ingestHeaders($client));
    }

    public function testAdminRequestsIdentifyThePhpSdkAndItsVersion(): void
    {
        $this->assertContains("X-Custd-Sdk: php/" . CustdClient::VERSION, $this->adminHeaders("admin-token"));
    }

    public function testWrappersAreDistinguishableFromRawPhp(): void
    {
        $client = new CustdClient("http://localhost:8080", "token", ["product" => "laravel"]);

        $this->assertContains("X-Custd-Sdk: laravel/" . CustdClient::VERSION, $this->ingestHeaders($client));
    }

    public function testProductMustBeALowercaseToken(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new CustdClient("http://localhost:8080", "token", ["product" => "Not A Token"]);
    }
}
