<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\CreateSiteDomainRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingState;
use HaakCo\Custd\Admin\SiteDomainClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class SiteDomainClientTest extends TestCase
{
    private const BASE = "http://localhost:8080/api/v1/site-domains";

    public function testOperationsSendTheirRoutesAndCompanySlug(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $domains->create(new CreateSiteDomainRequest("s-1", "www.example.com"), "acme");
        $domains->list("s-1", "acme");
        $domains->get("d-1");
        $domains->verify("d-1", "acme");
        $domains->requestAudit("d-1", "acme");
        $domains->listFindings("d-1", SiteFindingState::All, "acme");
        $domains->delete("d-1", "acme");

        self::assertSame(["siteUuid" => "s-1", "host" => "www.example.com"], $calls[0]["body"]);
        self::assertSame(
            [
                "POST " . self::BASE . "?companySlug=acme",
                "GET " . self::BASE . "?siteUuid=s-1&companySlug=acme",
                "GET " . self::BASE . "/d-1",
                "POST " . self::BASE . "/d-1/verify?companySlug=acme",
                "POST " . self::BASE . "/d-1/audit?companySlug=acme",
                "GET " . self::BASE . "/d-1/findings?state=all&companySlug=acme",
                "DELETE " . self::BASE . "/d-1?companySlug=acme",
            ],
            array_map(fn (array $call): string => $call["method"] . " " . $call["url"], $calls),
        );
    }

    public function testResponsesDecodeIntoTypedDtos(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $domain = $domains->list("s-1")->domains[0];
        self::assertTrue($domain->ownership->verified);
        self::assertSame("dns", $domain->ownership->verifiedBy);
        self::assertSame("custd-verification=tok", $domain->ownership->instructions->dnsRecordValue);
        self::assertNull($domain->audit->requestedAt);
        self::assertSame(1, $domain->audit->lastSummary?->high);

        $finding = $domains->listFindings("d-1")->findings[0];
        self::assertSame(self::BASE . "/d-1/findings", $calls[1]["url"]);
        self::assertSame("high", $finding->severity);
        self::assertFalse($finding->history->fixed);
        self::assertNull($finding->history->fixedAt);
    }

    public function testAuditOfUnverifiedDomainThrowsTypedProblem(): void
    {
        $transport = fn (): array => ["status" => 409, "body" => json_encode([
            "title" => "Conflict",
            "status" => 409,
            "detail" => "site domain: verify the domain before asking for an audit",
            "code" => SiteDomainClient::NOT_VERIFIED_CODE,
        ], JSON_THROW_ON_ERROR)];
        $client = new CustdClient("http://localhost:8080", "token", ["admin_http_client" => $transport]);

        try {
            $client->adminSiteDomains()->requestAudit("d-1");
            self::fail("expected the unverified audit to be refused");
        } catch (AdminProblemException $error) {
            self::assertSame(409, $error->status);
            self::assertSame(SiteDomainClient::NOT_VERIFIED_CODE, $error->problem->code);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function domain(): array
    {
        return [
            "domainUuid" => "d-1",
            "siteUuid" => "s-1",
            "host" => "www.example.com",
            "ownership" => [
                "verified" => true,
                "verifiedAt" => "2026-11-10T08:00:00Z",
                "verifiedBy" => "dns",
                "instructions" => [
                    "dnsRecordName" => "_custd-verification.www.example.com",
                    "dnsRecordValue" => "custd-verification=tok",
                    "fileUrl" => "https://www.example.com/.well-known/custd-verification.txt",
                    "fileContent" => "tok",
                ],
            ],
            "audit" => [
                "lastAuditedAt" => "2026-11-11T08:00:00Z",
                "lastSummary" => [
                    "high" => 1, "medium" => 2, "low" => 0, "info" => 3,
                    "pagesChecked" => 4, "requests" => 9, "truncated" => false,
                ],
            ],
            "createdAt" => "2026-11-09T08:00:00Z",
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function finding(): array
    {
        return [
            "findingUuid" => "f-1",
            "rule" => "tls.expiring",
            "severity" => "high",
            "title" => "Certificate expires soon",
            "url" => "https://www.example.com/",
            "evidence" => "9 days",
            "fix" => "Renew it",
            "source" => "tls",
            "history" => [
                "firstSeenAt" => "2026-11-10T08:00:00Z",
                "lastSeenAt" => "2026-11-11T08:00:00Z",
                "fixed" => false,
            ],
        ];
    }

    /**
     * client answers each route with the shape that route returns.
     *
     * @param array<int, array<string, mixed>> $calls
     */
    private function client(array &$calls): CustdClient
    {
        $domain = $this->domain();
        $finding = $this->finding();
        $transport = function (string $method, string $url, ?array $body) use (&$calls, $domain, $finding): array {
            $calls[] = compact("method", "url", "body");
            $path = (string) parse_url($url, PHP_URL_PATH);
            if ($method === "DELETE") {
                return ["status" => 204, "body" => ""];
            }
            $payload = match (true) {
                str_ends_with($path, "/findings") => ["findings" => [$finding]],
                $method === "GET" && str_ends_with($path, "/site-domains") => ["domains" => [$domain]],
                default => $domain,
            };

            return ["status" => 200, "body" => json_encode($payload, JSON_THROW_ON_ERROR)];
        };

        return new CustdClient("http://localhost:8080", "token", ["admin_http_client" => $transport]);
    }
}
