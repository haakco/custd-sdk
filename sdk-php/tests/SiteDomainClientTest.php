<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AdminProblemException;
use HaakCo\Custd\Admin\SiteDomain\CreateSiteDomainRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteCheckMode;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingState;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchConnectionStatus;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
use HaakCo\Custd\Admin\SiteDomain\SiteUptimeStatus;
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

    /** A site-bound credential names no Site: the request carries none and Custd uses its own. */
    public function testSiteBoundCredentialOmitsItsSite(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $domains->create(CreateSiteDomainRequest::forOwnSite("shop.example.com"));
        $domains->list();

        self::assertSame(["host" => "shop.example.com"], $calls[0]["body"]);
        self::assertSame("GET " . self::BASE, $calls[1]["method"] . " " . $calls[1]["url"]);
    }

    /** A reseller emails one Site's alerts to its customer, and clears it again. */
    public function testSiteAlertDestinationRoutes(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $domains->setAlertDestination("s-1", "owner@customer.example");
        $domains->setAlertDestination(null, null);
        $domains->getAlertDestination();

        self::assertSame(["emailRecipient" => "owner@customer.example"], $calls[0]["body"]);
        self::assertSame(["emailRecipient" => ""], $calls[1]["body"]);
        self::assertSame(
            [
                "PUT " . self::BASE . "/alert-destination?siteUuid=s-1",
                "PUT " . self::BASE . "/alert-destination",
                "GET " . self::BASE . "/alert-destination",
            ],
            array_map(fn (array $call): string => $call["method"] . " " . $call["url"], $calls),
        );
    }

    /** A client reads the search account, connects Bing with its key, reads numbers and disconnects Google. */
    public function testSiteSearchRoutesAndDecode(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $account = $domains->getSearchAccount();
        $performance = $domains->getSearchPerformance("d-1", 7, "acme");
        $connection = $domains->connectSearch(
            "d-1",
            SiteSearchProvider::Bing,
            "https://www.example.com/",
            "bing-api-key-0123456789",
        );
        $domains->connectSearch("d-1", SiteSearchProvider::Google, "sc-domain:example.com");
        $domains->disconnectSearch("d-1", SiteSearchProvider::Google);

        self::assertTrue($account->googleConfigured);
        self::assertFalse($account->bingConfigured);
        self::assertSame("custd@project.iam.gserviceaccount.com", $account->googleServiceAccountEmail);
        self::assertSame(SiteSearchConnectionStatus::Active, $performance->connections[0]->status);
        self::assertSame(42, $performance->sources[0]->totals->clicks);
        self::assertSame(8.4, $performance->sources[0]->totals->position);
        self::assertNull($performance->topPages[0]->totals->position);
        self::assertSame("example shop", $performance->topQueries[0]->key);
        self::assertSame(SiteSearchConnectionStatus::Pending, $connection->status);
        self::assertSame(
            ["property" => "https://www.example.com/", "apiKey" => "bing-api-key-0123456789"],
            $calls[2]["body"],
        );
        self::assertSame(["property" => "sc-domain:example.com"], $calls[3]["body"]);
        self::assertSame(
            [
                "GET " . self::BASE . "/search-account",
                "GET " . self::BASE . "/d-1/search?days=7&companySlug=acme",
                "PUT " . self::BASE . "/d-1/search/bing",
                "PUT " . self::BASE . "/d-1/search/google",
                "DELETE " . self::BASE . "/d-1/search/google",
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

    public function testCheckModeAndIncidentsSendTheirRoutesAndDecode(): void
    {
        $calls = [];
        $domains = $this->client($calls)->adminSiteDomains();

        $domain = $domains->setCheckMode("d-1", SiteCheckMode::Paused, "acme");
        self::assertSame(["mode" => "paused"], $calls[0]["body"]);
        self::assertSame(SiteCheckMode::Warm, $domain->checks->mode);
        self::assertSame(SiteUptimeStatus::Down, $domain->checks->uptime->status);
        self::assertSame(820, $domain->checks->warming->unwarmedResponseMs);
        self::assertNull($domain->checks->warming->warmedResponseMs);
        self::assertSame(2, $domain->checks->openIncident?->failedChecks);

        $incident = $domains->listIncidents("d-1")->incidents[0];
        self::assertSame("2026-11-12T10:20:00Z", $incident->resolvedAt);
        self::assertSame(
            ["PUT " . self::BASE . "/d-1/checks?companySlug=acme", "GET " . self::BASE . "/d-1/incidents"],
            array_map(fn (array $call): string => $call["method"] . " " . $call["url"], $calls),
        );
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
            "checks" => [
                "mode" => "warm",
                "uptime" => [
                    "status" => "down", "statusCode" => 503, "responseMs" => 120,
                    "lastFailure" => "HTTP 503", "consecutiveFailures" => 2,
                ],
                "tls" => ["validTo" => "2027-01-30T00:00:00Z", "issuer" => "R11"],
                "warming" => ["unwarmedResponseMs" => 820],
                "openIncident" => $this->incident(null),
            ],
            "createdAt" => "2026-11-09T08:00:00Z",
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function incident(?string $resolvedAt): array
    {
        $incident = [
            "incidentUuid" => "i-1",
            "startedAt" => "2026-11-12T10:00:00Z",
            "openedAt" => "2026-11-12T10:05:00Z",
            "cause" => "HTTP 503",
            "failedChecks" => 2,
        ];

        return $resolvedAt === null ? $incident : $incident + ["resolvedAt" => $resolvedAt];
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

    /** @return array<string, mixed> */
    private function searchPerformance(): array
    {
        $connection = ["provider" => "google", "property" => "sc-domain:example.com", "status" => "active"];
        $totals = ["clicks" => 42, "impressions" => 1200, "ctr" => 0.035, "position" => 8.4];
        $source = ["provider" => "google", "source" => "Google Search Console", "granularity" => "daily",
            "from" => "2026-11-04", "to" => "2026-11-10", "days" => 7, "totals" => $totals];

        return [
            "domainUuid" => "d-1",
            "days" => 7,
            "connections" => [$connection],
            "sources" => [$source],
            "topPages" => [["provider" => "google", "key" => "https://www.example.com/",
                "totals" => ["clicks" => 30, "impressions" => 800, "ctr" => 0.0375]]],
            "topQueries" => [["provider" => "google", "key" => "example shop", "totals" => $totals]],
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
        $incident = $this->incident("2026-11-12T10:20:00Z");
        $transport = function (string $method, string $url, ?array $body) use (&$calls, $domain, $finding, $incident): array {
            $calls[] = compact("method", "url", "body");
            $path = (string) parse_url($url, PHP_URL_PATH);
            if ($method === "DELETE") {
                return ["status" => 204, "body" => ""];
            }
            $payload = match (true) {
                str_ends_with($path, "/alert-destination") => ["siteUuid" => "s-1"],
                str_ends_with($path, "/search-account") => [
                    "googleConfigured" => true,
                    "googleServiceAccountEmail" => "custd@project.iam.gserviceaccount.com",
                    "bingConfigured" => false,
                ],
                str_ends_with($path, "/search") => $this->searchPerformance(),
                str_contains($path, "/search/") => ["provider" => "bing", "property" => "https://www.example.com/", "status" => "pending"],
                str_ends_with($path, "/findings") => ["findings" => [$finding]],
                str_ends_with($path, "/incidents") => ["incidents" => [$incident]],
                $method === "GET" && str_ends_with($path, "/site-domains") => ["domains" => [$domain]],
                default => $domain,
            };

            return ["status" => 200, "body" => json_encode($payload, JSON_THROW_ON_ERROR)];
        };

        return new CustdClient("http://localhost:8080", "token", ["admin_http_client" => $transport]);
    }
}
