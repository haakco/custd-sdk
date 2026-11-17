<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\CustdClient;

/**
 * SiteFixtureReplay answers Site Insights calls with one entry of a shared contract fixture and
 * records each request, so a test asserts the route, the body and the decoded DTO.
 */
trait SiteFixtureReplay
{
    abstract private static function fixtureFile(): string;

    private static function fixtureValue(string $key): \stdClass
    {
        $fixture = json_decode(
            (string) file_get_contents(__DIR__ . '/../../contract-fixtures/' . self::fixtureFile()),
            false,
            512,
            JSON_THROW_ON_ERROR,
        );
        self::assertInstanceOf(\stdClass::class, $fixture);
        $value = $fixture->{$key};
        self::assertInstanceOf(\stdClass::class, $value);

        return $value;
    }

    /**
     * fixtureArray is a request fixture as the associative array the SDK sends.
     *
     * @return array<string, mixed>
     */
    private static function fixtureArray(string $key): array
    {
        /** @var array<string, mixed> $value */
        $value = json_decode(json_encode(self::fixtureValue($key), JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

        return $value;
    }

    /**
     * replay answers every request with the fixture entry $key (an empty body for 204).
     *
     * @param list<array{route: string, body: array<string, mixed>|null}>|null $calls
     * @param-out list<array{route: string, body: array<string, mixed>|null}> $calls
     */
    private function replay(?array &$calls, string $key, int $status = 200): SiteDomainClient
    {
        $calls ??= [];
        $body = $status === 204 ? '' : json_encode(self::fixtureValue($key), JSON_THROW_ON_ERROR);
        $transport = static function (string $method, string $url, ?array $request) use (&$calls, $body, $status): array {
            $calls[] = ['route' => $method . ' ' . $url, 'body' => $request];

            return ['status' => $status, 'body' => $body];
        };

        return (new CustdClient('http://localhost:8080', 'token', ['admin_http_client' => $transport]))->adminSiteDomains();
    }

    /**
     * assertRefusals runs $call against each problem fixture and asserts it surfaces as its named code.
     *
     * @param array<string, string> $codes problem fixture key => code constant
     * @param callable(SiteDomainClient): mixed $call
     */
    private function assertRefusals(array $codes, callable $call): void
    {
        foreach ($codes as $key => $code) {
            $problem = self::fixtureValue($key);
            $calls = null;
            try {
                $call($this->replay($calls, $key, (int) $problem->status));
                self::fail("expected {$key} to be refused");
            } catch (AdminProblemException $error) {
                self::assertSame($problem->status, $error->status);
                self::assertSame($code, $error->problem->code);
            }
        }
    }
}
