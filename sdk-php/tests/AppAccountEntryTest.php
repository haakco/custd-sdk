<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\App\AppAccountEntryException;
use HaakCo\Custd\App\AppAccountEntryRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * AppAccountEntryTest proves the hosted settings ticket request: it goes to the configured issuer with the
 * application token, and untrusted input or answers are refused without exposing ticket material.
 */
final class AppAccountEntryTest extends TestCase
{
    private const ISSUER = 'https://auth.canvas.test';

    private const ACTION = self::ISSUER . '/settings/entry';

    private const ORIGIN = 'https://canvas.test';

    /** @var list<array{method: string, url: string, body: mixed, token: string, headers: array<string, string>}> */
    private array $calls = [];

    public function testEntryPostsToTheIssuerWithTheAppToken(): void
    {
        $ticket = str_repeat('A', 43);
        foreach (['' => ['applicationOrigin' => self::ORIGIN], '/mine' => ['applicationOrigin' => self::ORIGIN, 'returnPath' => '/mine']] as $returnPath => $body) {
            $this->calls = [];
            $entry = $this->entry(['actionUrl' => self::ACTION, 'ticket' => $ticket], (string) $returnPath);

            self::assertSame([self::ACTION, $ticket], [$entry->actionUrl, $entry->ticket]);
            self::assertStringNotContainsString($ticket, print_r($entry, true));
            self::assertSame(
                [['method' => 'POST', 'url' => self::ACTION . '/ticket', 'body' => $body, 'token' => 'app-token', 'headers' => ['Content-Type' => 'application/json']]],
                $this->calls,
            );
        }
    }

    /** @param array<string, mixed>|null $answer */
    #[DataProvider('refused')]
    public function testEntryRefusesUntrustedInputAndAnswers(string $origin, string $returnPath, ?array $answer, bool $sent): void
    {
        try {
            $this->entry($answer ?? [], $returnPath, $origin);
            self::fail('expected a refusal');
        } catch (\InvalidArgumentException | \UnexpectedValueException $refused) {
            self::assertStringNotContainsString(str_repeat('A', 42), $refused->getMessage());
        }
        self::assertSame($sent, $this->calls !== []);
    }

    /** @return array<string, array{string, string, array<string, mixed>|null, bool}> */
    public static function refused(): array
    {
        return [
            'origin with path' => ['https://canvas.test/app', '', null, false],
            'origin with :443' => ['https://canvas.test:443', '', null, false],
            'backslash host' => ['https://canvas.test\\evil', '', null, false],
            'scheme-relative' => [self::ORIGIN, '//evil', null, false],
            'fragment' => [self::ORIGIN, '/a#b', null, false],
            'relative' => [self::ORIGIN, 'mine', null, false],
            'backslash' => [self::ORIGIN, '/\\x', null, false],
            '513 bytes' => [self::ORIGIN, '/' . str_repeat('a', 512), null, false],
            'other action' => [self::ORIGIN, '', ['actionUrl' => 'https://other.test/settings/entry', 'ticket' => str_repeat('A', 43)], true],
            'short ticket' => [self::ORIGIN, '', ['actionUrl' => self::ACTION, 'ticket' => str_repeat('A', 42)], true],
            'non-canonical ticket' => [self::ORIGIN, '', ['actionUrl' => self::ACTION, 'ticket' => str_repeat('A', 42) . 'B'], true],
        ];
    }

    public function testEntryErrorCarriesTheStatusOnly(): void
    {
        $ticket = str_repeat('A', 43);
        try {
            $this->entry(['detail' => $ticket], '', self::ORIGIN, 403);
            self::fail('expected a refusal');
        } catch (AppAccountEntryException $refused) {
            self::assertSame(403, $refused->status);
            self::assertStringNotContainsString($ticket, $refused->getMessage());
        }
    }

    /** @param array<string, mixed> $answer */
    private function entry(array $answer, string $returnPath, string $origin = self::ORIGIN, int $status = 200): \HaakCo\Custd\App\AppAccountEntry
    {
        $transport = function (string $method, string $url, mixed $body, string $token, array $headers) use ($answer, $status): array {
            $this->calls[] = ['method' => $method, 'url' => $url, 'body' => $body, 'token' => $token, 'headers' => $headers];

            return ['status' => $status, 'body' => json_encode($answer, JSON_THROW_ON_ERROR)];
        };
        $client = new CustdClient('http://localhost:8080', 'operator-token', ['admin_http_client' => $transport]);

        return $client->appProfile('app-token')->createAccountEntry(new AppAccountEntryRequest(self::ISSUER . '/', $origin, $returnPath));
    }
}
