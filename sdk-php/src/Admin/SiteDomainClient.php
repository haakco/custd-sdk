<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\CreateSiteDomainRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAlertDestination;
use HaakCo\Custd\Admin\SiteDomain\SiteCheckMode;
use HaakCo\Custd\Admin\SiteDomain\SiteDomain;
use HaakCo\Custd\Admin\SiteDomain\SiteDomainList;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingList;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingState;
use HaakCo\Custd\Admin\SiteDomain\SiteIncidentList;
use HaakCo\Custd\Admin\SiteDomain\SiteIndexNowState;
use HaakCo\Custd\Admin\SiteDomain\SiteIndexNowSubmission;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchAccount;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchConnection;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchPerformance;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
use HaakCo\Custd\Admin\SiteDomain\SiteReport;
use HaakCo\Custd\Admin\SiteDomain\SiteReportShareRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteReportShareCreated;
use HaakCo\Custd\Admin\SiteDomain\SiteReportShareList;
use HaakCo\Custd\Admin\SiteDomain\SiteUptimeHistory;
use HaakCo\Custd\Admin\SiteDomain\SiteLighthouseHistory;
use HaakCo\Custd\Admin\SiteDomain\SitePageCheckRequest;
use HaakCo\Custd\Admin\SiteDomain\SitePageCheckResponse;
use HaakCo\Custd\Admin\SiteDomain\SitePageFacts;
use HaakCo\Custd\Admin\SiteDomain\SitePageRecheck;
use HaakCo\Custd\Admin\SiteDomain\SiteProjectContext;
use HaakCo\Custd\Admin\SiteDomain\SiteProjectContextRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteRobotsTestRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteRobotsTestResult;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchDimension;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchInspection;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchInspectionList;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchRowPage;
use HaakCo\Custd\Fields;

/**
 * SiteDomainClient claims the hosts a site serves, proves the tenant controls
 * them, and reads the findings of their scheduled audits. It is reached through
 * CustdClient::adminSiteDomains().
 *
 * Every operation takes an optional company slug: a system administrator names
 * the tenant with it, a tenant credential leaves it null.
 */
final class SiteDomainClient
{
    /** The problem code of the 409 returned when an unverified domain is asked for an audit. */
    public const NOT_VERIFIED_CODE = 'site_domain_not_verified';

    /** The problem code of the 409 returned when this deployment has no account or key for a search provider. */
    public const SEARCH_NOT_CONFIGURED_CODE = 'site_search_not_configured';

    /** The problem code of the 404 returned when disconnecting a provider the domain is not connected to. */
    public const SEARCH_CONNECTION_NOT_FOUND_CODE = 'site_search_connection_not_found';

    /** The problem code of the 400 returned when a page tool names a URL off the domain's own host. */
    public const PAGE_NOT_ON_DOMAIN_CODE = 'site_page_not_on_domain';

    /** The problem code of the 429 returned once the domain's hourly page rechecks are used up. */
    public const PAGE_RECHECK_LIMIT_CODE = 'site_page_recheck_limit';

    /** The problem code of the 400 returned when a URL to inspect is not an http(s) URL on the domain's host. */
    public const SEARCH_INSPECTION_URL_INVALID_CODE = 'site_search_inspection_url_invalid';

    /** The problem code of the 409 returned when the domain is unverified or not connected to Google. */
    public const SEARCH_INSPECTION_NOT_CONNECTED_CODE = 'site_search_inspection_not_connected';

    /** The problem code of the 429 returned once the tenant's daily URL inspections are used up. */
    public const SEARCH_INSPECTION_LIMIT_CODE = 'site_search_inspection_limit';

    /** The problem code of the 409 returned when enabling IndexNow on an unverified domain. */
    public const INDEXNOW_DOMAIN_UNVERIFIED_CODE = 'site_indexnow_domain_unverified';

    /** The problem code of the 409 returned when verifying or submitting before IndexNow is enabled. */
    public const INDEXNOW_NOT_ENABLED_CODE = 'site_indexnow_not_enabled';

    /** The problem code of the 409 returned when submitting before the key file is verified. */
    public const INDEXNOW_KEY_UNVERIFIED_CODE = 'site_indexnow_key_unverified';

    /** The problem code of the 400 returned unless urls are 1 to 100 distinct http(s) URLs on the domain's host. */
    public const INDEXNOW_URLS_INVALID_CODE = 'site_indexnow_urls_invalid';

    /** The problem code of the 429 returned once the tenant's daily IndexNow URLs are used up. */
    public const INDEXNOW_LIMIT_CODE = 'site_indexnow_limit';

    private const PREFIX = '/api/v1';
    private const COLLECTION = '/site-domains';

    /** @var callable|null */
    private $transport;

    /** @var string|callable():string Bearer token, or a provider run per request. */
    private readonly mixed $token;

    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        ?callable $transport = null
    ) {
        $this->token = $token;
        $this->transport = $transport;
    }

    /** Claim a host for a site. The result carries the verification instructions. */
    public function create(CreateSiteDomainRequest $request, ?string $companySlug = null): SiteDomain
    {
        return SiteDomain::fromPayload(
            $this->send('POST', self::COLLECTION, [], $companySlug, $request->serialise())
        );
    }

    /**
     * List one site's domains. A site-bound credential (site_domains.manage) may pass null and
     * gets its own Site's domains; naming another Site is refused as not found.
     */
    public function list(?string $siteUuid = null, ?string $companySlug = null): SiteDomainList
    {
        return SiteDomainList::fromPayload(
            $this->send('GET', self::COLLECTION, self::siteQuery($siteUuid), $companySlug)
        );
    }

    public function get(string $domainUuid, ?string $companySlug = null): SiteDomain
    {
        return SiteDomain::fromPayload($this->send('GET', self::item($domainUuid), [], $companySlug));
    }

    /**
     * Check the DNS record or well-known file now. An unproven domain comes back
     * with ownership->verified false and the reason in lastCheckFailure.
     */
    public function verify(string $domainUuid, ?string $companySlug = null): SiteDomain
    {
        return SiteDomain::fromPayload($this->send('POST', self::item($domainUuid) . '/verify', [], $companySlug));
    }

    /**
     * Attest that this credential has proven the tenant controls the domain, which verifies it
     * (ownership->verifiedBy "attested") and its subdomains; a repeat refreshes the time. Only a
     * site-bound credential holding site_domains.attest may attest, and only its own Site's
     * domains: any other caller gets 403, another Site's domain 404.
     */
    public function attest(string $domainUuid): SiteDomain
    {
        return SiteDomain::fromPayload($this->send('POST', self::item($domainUuid) . '/attestation', [], null));
    }

    /** Withdraw this credential's attestation; the domain stays verified only by its own proof or a verified parent. */
    public function unattest(string $domainUuid): SiteDomain
    {
        return SiteDomain::fromPayload($this->send('DELETE', self::item($domainUuid) . '/attestation', [], null));
    }

    /**
     * Ask for the domain to be audited on the scheduler's next tick. An
     * unverified domain throws AdminProblemException whose problem code is
     * {@see self::NOT_VERIFIED_CODE}.
     */
    public function requestAudit(string $domainUuid, ?string $companySlug = null): SiteDomain
    {
        return SiteDomain::fromPayload($this->send('POST', self::item($domainUuid) . '/audit', [], $companySlug));
    }

    /** List a domain's findings; the server defaults to open findings when state is null. */
    public function listFindings(
        string $domainUuid,
        ?SiteFindingState $state = null,
        ?string $companySlug = null,
    ): SiteFindingList {
        $query = $state === null ? [] : ['state' => $state->value];

        return SiteFindingList::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/findings', $query, $companySlug)
        );
    }

    /**
     * Choose how a domain is checked. It works before verification too, so a
     * consumer can pause a domain before its first check.
     */
    public function setCheckMode(string $domainUuid, SiteCheckMode $mode, ?string $companySlug = null): SiteDomain
    {
        return SiteDomain::fromPayload(
            $this->send('PUT', self::item($domainUuid) . '/checks', [], $companySlug, ['mode' => $mode->value])
        );
    }

    /**
     * Read where a Site's finding and outage alerts go. A site-bound credential may pass null for
     * its own Site.
     */
    public function getAlertDestination(?string $siteUuid = null, ?string $companySlug = null): SiteAlertDestination
    {
        return SiteAlertDestination::fromPayload(
            $this->send('GET', self::COLLECTION . '/alert-destination', self::siteQuery($siteUuid), $companySlug)
        );
    }

    /**
     * Email a Site's finding and outage alerts to $emailRecipient instead of the tenant's
     * destinations, so a reseller can alert its customer; null sends them back to the tenant's.
     */
    public function setAlertDestination(
        ?string $siteUuid,
        ?string $emailRecipient,
        ?string $companySlug = null
    ): SiteAlertDestination {
        return SiteAlertDestination::fromPayload($this->send(
            'PUT',
            self::COLLECTION . '/alert-destination',
            self::siteQuery($siteUuid),
            $companySlug,
            ['emailRecipient' => $emailRecipient ?? '']
        ));
    }

    /** @return array<string, string> */
    private static function siteQuery(?string $siteUuid): array
    {
        return $siteUuid === null || $siteUuid === '' ? [] : ['siteUuid' => $siteUuid];
    }

    /** List a domain's recent outages, newest first (at most twenty). */
    public function listIncidents(string $domainUuid, ?string $companySlug = null): SiteIncidentList
    {
        return SiteIncidentList::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/incidents', [], $companySlug)
        );
    }

    /** Read which search providers this deployment can import from, and the Google service account to add. */
    public function getSearchAccount(?string $companySlug = null): SiteSearchAccount
    {
        return SiteSearchAccount::fromPayload(
            $this->send('GET', self::COLLECTION . '/search-account', [], $companySlug)
        );
    }

    /** Read a domain's imported search numbers over the last $days days (1..90); null lets the server default to 28. */
    public function getSearchPerformance(
        string $domainUuid,
        ?int $days = null,
        ?string $companySlug = null,
    ): SiteSearchPerformance {
        $query = $days === null ? [] : ['days' => (string) $days];

        return SiteSearchPerformance::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/search', $query, $companySlug)
        );
    }

    /**
     * Connect a domain to a search provider, or replace its property or key. $property is
     * "sc-domain:example.com" or a URL prefix for Google, and a URL prefix ending in "/" for Bing.
     * $apiKey is Bing only, write-only and never returned. A deployment without an account or key
     * for the provider throws AdminProblemException with {@see self::SEARCH_NOT_CONFIGURED_CODE}.
     */
    public function connectSearch(
        string $domainUuid,
        SiteSearchProvider $provider,
        string $property,
        #[\SensitiveParameter] ?string $apiKey = null,
        ?string $companySlug = null,
    ): SiteSearchConnection {
        $body = ['property' => $property];
        if ($apiKey !== null && $apiKey !== '') {
            $body['apiKey'] = $apiKey;
        }

        return SiteSearchConnection::fromPayload(
            $this->send('PUT', self::searchConnection($domainUuid, $provider), [], $companySlug, $body)
        );
    }

    /**
     * Remove a provider connection and the numbers imported through it. A provider that is not
     * connected throws AdminProblemException with {@see self::SEARCH_CONNECTION_NOT_FOUND_CODE}.
     */
    public function disconnectSearch(
        string $domainUuid,
        SiteSearchProvider $provider,
        ?string $companySlug = null,
    ): void {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'DELETE',
            self::withQuery(self::searchConnection($domainUuid, $provider), [], $companySlug),
            null,
            self::PREFIX
        );
    }

    /**
     * Page through one dimension of a domain's imported search rows. Null arguments let the server
     * default to the query dimension, every provider, 28 days, offset 0 and 100 rows (limit 1..1000).
     */
    public function listSearchRows(
        string $domainUuid,
        ?SiteSearchDimension $dimension = null,
        ?SiteSearchProvider $provider = null,
        ?int $days = null,
        ?int $offset = null,
        ?int $limit = null,
        ?string $companySlug = null,
    ): SiteSearchRowPage {
        $query = array_filter([
            'dimension' => $dimension?->value,
            'provider' => $provider?->value,
            'days' => $days === null ? null : (string) $days,
            'offset' => $offset === null ? null : (string) $offset,
            'limit' => $limit === null ? null : (string) $limit,
        ], static fn (?string $value): bool => $value !== null);

        return SiteSearchRowPage::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/search/rows', $query, $companySlug)
        );
    }

    /** List a domain's latest Google URL inspections and the tenant's use of its daily limit. */
    public function listSearchInspections(string $domainUuid, ?string $companySlug = null): SiteSearchInspectionList
    {
        return SiteSearchInspectionList::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/search/inspections', [], $companySlug)
        );
    }

    /**
     * Queue a Google URL Inspection of $url (on the domain's host); the route answers 202 and the
     * scheduler asks Google on its next tick. Refusals carry {@see self::SEARCH_INSPECTION_URL_INVALID_CODE},
     * {@see self::SEARCH_INSPECTION_NOT_CONNECTED_CODE} or {@see self::SEARCH_INSPECTION_LIMIT_CODE}.
     */
    public function requestSearchInspection(string $domainUuid, string $url, ?string $companySlug = null): SiteSearchInspection
    {
        return SiteSearchInspection::fromPayload(
            $this->send('POST', self::item($domainUuid) . '/search/inspections', [], $companySlug, ['url' => $url])
        );
    }

    /** Read what the latest audit or recheck read from one page of the domain. */
    public function getPageFacts(string $domainUuid, string $url, ?string $companySlug = null): SitePageFacts
    {
        return SitePageFacts::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/page-facts', ['url' => $url], $companySlug)
        );
    }

    /**
     * Queue one page of a verified domain to be checked again (202). A page already waiting comes
     * back as it is; a URL off the domain throws {@see self::PAGE_NOT_ON_DOMAIN_CODE} and the
     * hourly allowance {@see self::PAGE_RECHECK_LIMIT_CODE}.
     */
    public function requestPageRecheck(string $domainUuid, string $url, ?string $companySlug = null): SitePageRecheck
    {
        return SitePageRecheck::fromPayload(
            $this->send('POST', self::item($domainUuid) . '/page-rechecks', [], $companySlug, ['url' => $url])
        );
    }

    /** Read one page recheck; poll it until its state is checked or failed. */
    public function getPageRecheck(string $domainUuid, string $recheckUuid, ?string $companySlug = null): SitePageRecheck
    {
        return SitePageRecheck::fromPayload($this->send(
            'GET',
            self::item($domainUuid) . '/page-rechecks/' . rawurlencode($recheckUuid),
            [],
            $companySlug
        ));
    }

    /** Run the one-page checks on draft HTML before it is published. Nothing is fetched or stored. */
    public function checkPage(
        string $domainUuid,
        SitePageCheckRequest $request,
        ?string $companySlug = null,
    ): SitePageCheckResponse {
        return SitePageCheckResponse::fromPayload(
            $this->send('POST', self::item($domainUuid) . '/page-check', [], $companySlug, $request->serialise())
        );
    }

    /** Test a URL against a pasted robots.txt, or the domain's live file, by RFC 9309. */
    public function testRobots(
        string $domainUuid,
        SiteRobotsTestRequest $request,
        ?string $companySlug = null,
    ): SiteRobotsTestResult {
        return SiteRobotsTestResult::fromPayload(
            $this->send('POST', self::item($domainUuid) . '/robots-test', [], $companySlug, $request->serialise())
        );
    }

    /** Read a Site's brand names, competitors and markets. A site-bound credential may pass null for its own Site. */
    public function getProjectContext(?string $siteUuid = null, ?string $companySlug = null): SiteProjectContext
    {
        return SiteProjectContext::fromPayload(
            $this->send('GET', self::COLLECTION . '/project-context', self::siteQuery($siteUuid), $companySlug)
        );
    }

    /** Replace a Site's project context; empty lists clear it. A site-bound credential may pass null for its own Site. */
    public function setProjectContext(
        ?string $siteUuid,
        SiteProjectContextRequest $request,
        ?string $companySlug = null,
    ): SiteProjectContext {
        return SiteProjectContext::fromPayload($this->send(
            'PUT',
            self::COLLECTION . '/project-context',
            self::siteQuery($siteUuid),
            $companySlug,
            $request->serialise()
        ));
    }

    /** Read a domain's IndexNow setup, daily URL use and latest submissions. */
    public function getIndexNow(string $domainUuid, ?string $companySlug = null): SiteIndexNowState
    {
        return SiteIndexNowState::fromPayload($this->send('GET', self::indexNow($domainUuid), [], $companySlug));
    }

    /**
     * Enable IndexNow on a verified domain. Serve the returned key at keyLocation, then call
     * verifyIndexNow(). An unverified domain throws {@see self::INDEXNOW_DOMAIN_UNVERIFIED_CODE}.
     */
    public function enableIndexNow(string $domainUuid, ?string $companySlug = null): SiteIndexNowState
    {
        return SiteIndexNowState::fromPayload($this->send('PUT', self::indexNow($domainUuid), [], $companySlug));
    }

    /** Disable IndexNow and forget the key. The route returns 204 No Content. */
    public function disableIndexNow(string $domainUuid, ?string $companySlug = null): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'DELETE',
            self::withQuery(self::indexNow($domainUuid), [], $companySlug),
            null,
            self::PREFIX
        );
    }

    /** Check the key file now. A failed check is not an error: it comes back in lastCheckFailure. */
    public function verifyIndexNow(string $domainUuid, ?string $companySlug = null): SiteIndexNowState
    {
        return SiteIndexNowState::fromPayload(
            $this->send('POST', self::indexNow($domainUuid) . '/verify', [], $companySlug)
        );
    }

    /**
     * Queue 1 to 100 changed URLs on the domain's host for IndexNow (202). Accepted means IndexNow
     * received them, not that they are indexed.
     *
     * @param list<string> $urls
     */
    public function submitIndexNow(string $domainUuid, array $urls, ?string $companySlug = null): SiteIndexNowSubmission
    {
        return SiteIndexNowSubmission::fromPayload($this->send(
            'POST',
            self::indexNow($domainUuid) . '/submissions',
            [],
            $companySlug,
            ['urls' => $urls]
        ));
    }

    /** Read the complete client report without exposing private verification or connection details. */
    public function getReport(string $domainUuid, ?string $companySlug = null): SiteReport
    {
        return SiteReport::fromPayload($this->send('GET', self::item($domainUuid) . '/report', [], $companySlug));
    }

    /** Read uptime windows, ninety daily bars and hourly response times (responseDays: 1..90). */
    public function getUptimeHistory(string $domainUuid, ?int $responseDays = null, ?string $companySlug = null): SiteUptimeHistory
    {
        $query = $responseDays === null ? [] : ['responseDays' => (string) $responseDays];

        return SiteUptimeHistory::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/uptime-history', $query, $companySlug)
        );
    }

    /** Read scheduled desktop/mobile lab runs over 1..30 days; null uses the server's seven days. */
    public function getLighthouseHistory(string $domainUuid, ?int $days = null, ?string $companySlug = null): SiteLighthouseHistory
    {
        $query = $days === null ? [] : ['days' => (string) $days];

        return SiteLighthouseHistory::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/lighthouse', $query, $companySlug)
        );
    }

    /** List safe metadata for live report shares. Tokens are returned only on creation. */
    public function listReportShares(string $domainUuid, ?string $companySlug = null): SiteReportShareList
    {
        return SiteReportShareList::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/report-shares', [], $companySlug)
        );
    }

    /** Create an explicit public share. Copy the token once; creation is never automatically retried. */
    public function createReportShare(
        string $domainUuid,
        SiteReportShareRequest $request,
        ?string $companySlug = null,
    ): SiteReportShareCreated {
        return SiteReportShareCreated::fromPayload(
            $this->send('POST', self::item($domainUuid) . '/report-shares', [], $companySlug, $request->serialise())
        );
    }

    /** Revoke a share; subsequent public reads fail. */
    public function revokeReportShare(string $domainUuid, string $shareUuid, ?string $companySlug = null): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'DELETE',
            self::withQuery(self::item($domainUuid) . '/report-shares/' . rawurlencode($shareUuid), [], $companySlug),
            null,
            self::PREFIX
        );
    }

    /** Remove a domain and its findings. The route returns 204 No Content. */
    public function delete(string $domainUuid, ?string $companySlug = null): void
    {
        Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            'DELETE',
            self::withQuery(self::item($domainUuid), [], $companySlug),
            null,
            self::PREFIX
        );
    }

    private static function item(string $domainUuid): string
    {
        return self::COLLECTION . '/' . rawurlencode($domainUuid);
    }

    private static function indexNow(string $domainUuid): string
    {
        return self::item($domainUuid) . '/indexnow';
    }

    private static function searchConnection(string $domainUuid, SiteSearchProvider $provider): string
    {
        return self::item($domainUuid) . '/search/' . $provider->value;
    }

    /** @param array<string, string> $query */
    private static function withQuery(string $path, array $query, ?string $companySlug): string
    {
        if ($companySlug !== null && $companySlug !== '') {
            $query['companySlug'] = $companySlug;
        }

        return $query === [] ? $path : $path . '?' . http_build_query($query);
    }

    /**
     * @param array<string, string> $query
     * @param array<string, mixed>|null $body
     */
    private function send(string $method, string $path, array $query, ?string $companySlug, ?array $body = null): \stdClass
    {
        return Fields::jsonObject(
            Http::requestStructured(
                $this->baseUrl,
                $this->token,
                $this->transport,
                $method,
                self::withQuery($path, $query, $companySlug),
                $body,
                self::PREFIX
            ),
            'site domain response'
        );
    }
}
