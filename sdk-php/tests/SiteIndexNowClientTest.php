<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\SiteIndexNowSubmissionStatus;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/** Replays contract-fixtures/site-indexnow.json through the IndexNow calls. */
final class SiteIndexNowClientTest extends TestCase
{
    private const BASE = 'http://localhost:8080/api/v1/site-domains/d-1/indexnow';

    public function testEnableVerifyReadAndDisable(): void
    {
        $disabled = $this->client($calls, 'disabled')->getIndexNow('d-1');
        $enabled = $this->client($calls, 'enabledUnverified')->enableIndexNow('d-1', 'acme');
        $verified = $this->client($calls, 'verified')->verifyIndexNow('d-1');
        $this->client($calls, 'disabled', status: 204)->disableIndexNow('d-1', 'acme');

        self::assertFalse($disabled->enabled);
        self::assertNull($disabled->key);
        self::assertNull($disabled->keyLocation);
        self::assertNull($disabled->verifiedAt);
        self::assertSame(1000, $disabled->dailyUrlLimit);
        self::assertSame([], $disabled->submissions);
        self::assertSame('https://example.com/3f0c8a1d2b7e4c6f9a0b1c2d3e4f5a6b.txt', $enabled->keyLocation);
        self::assertFalse($enabled->verified);
        self::assertSame('the key file answered HTTP 404', $enabled->lastCheckFailure);
        self::assertSame('2026-11-17T07:00:00Z', $verified->verifiedAt);
        self::assertNull($verified->lastCheckFailure);
        self::assertSame(3, $verified->urlsToday);

        [$queued, $accepted, $failed] = $verified->submissions;
        self::assertSame(SiteIndexNowSubmissionStatus::QUEUED, $queued->status);
        self::assertNull($queued->providerStatus);
        self::assertNull($queued->submittedAt);
        self::assertSame(SiteIndexNowSubmissionStatus::ACCEPTED, $accepted->status);
        self::assertSame(202, $accepted->providerStatus);
        self::assertSame('2026-11-17T07:11:00Z', $accepted->submittedAt);
        self::assertSame('IndexNow could not be reached after 3 attempts', $failed->failure);

        self::assertSame([
            'GET ' . self::BASE,
            'PUT ' . self::BASE . '?companySlug=acme',
            'POST ' . self::BASE . '/verify',
            'DELETE ' . self::BASE . '?companySlug=acme',
        ], array_column($calls, 'route'));
        self::assertSame([null, null, null, null], array_column($calls, 'body'));
    }

    public function testSubmitQueuesUrls(): void
    {
        $request = $this->fixture('submissionRequest');
        /** @var list<string> $urls */
        $urls = $request->urls;
        $submission = $this->client($calls, 'submissionQueued', status: 202)->submitIndexNow('d-1', $urls);

        self::assertSame(SiteIndexNowSubmissionStatus::QUEUED, $submission->status);
        self::assertSame($urls, $submission->urls);
        self::assertNull($submission->providerStatus);
        self::assertNull($submission->failure);
        self::assertSame(['urls' => $urls], $calls[0]['body']);
        self::assertSame('POST ' . self::BASE . '/submissions', $calls[0]['route']);
    }

    public function testRefusalsCarryNamedProblemCodes(): void
    {
        $cases = [
            'domainUnverifiedProblem' => SiteDomainClient::INDEXNOW_DOMAIN_UNVERIFIED_CODE,
            'notEnabledProblem' => SiteDomainClient::INDEXNOW_NOT_ENABLED_CODE,
            'keyUnverifiedProblem' => SiteDomainClient::INDEXNOW_KEY_UNVERIFIED_CODE,
            'urlsInvalidProblem' => SiteDomainClient::INDEXNOW_URLS_INVALID_CODE,
            'limitProblem' => SiteDomainClient::INDEXNOW_LIMIT_CODE,
        ];
        foreach ($cases as $key => $code) {
            $problem = $this->fixture($key);
            try {
                $this->client($calls, $key, status: (int) $problem->status)->submitIndexNow('d-1', ['https://example.com/']);
                self::fail("expected {$key} to be refused");
            } catch (AdminProblemException $error) {
                self::assertSame($problem->status, $error->status);
                self::assertSame($code, $error->problem->code);
            }
        }
    }

    private function fixture(string $key): \stdClass
    {
        $fixture = json_decode(
            (string) file_get_contents(__DIR__ . '/../../contract-fixtures/site-indexnow.json'),
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
     * client answers every request with one fixture entry (an empty body for 204) and records each call.
     *
     * @param list<array{route: string, body: array<string, mixed>|null}>|null $calls
     * @param-out list<array{route: string, body: array<string, mixed>|null}> $calls
     */
    private function client(?array &$calls, string $key, int $status = 200): SiteDomainClient
    {
        $calls ??= [];
        $body = $status === 204 ? '' : json_encode($this->fixture($key), JSON_THROW_ON_ERROR);
        $transport = static function (string $method, string $url, ?array $request) use (&$calls, $body, $status): array {
            $calls[] = ['route' => $method . ' ' . $url, 'body' => $request];

            return ['status' => $status, 'body' => $body];
        };

        return (new CustdClient('http://localhost:8080', 'token', ['admin_http_client' => $transport]))->adminSiteDomains();
    }
}
