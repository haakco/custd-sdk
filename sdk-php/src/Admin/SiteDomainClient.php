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
use HaakCo\Custd\Admin\SiteDomain\SiteSearchAccount;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchConnection;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchPerformance;
use HaakCo\Custd\Admin\SiteDomain\SiteSearchProvider;
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
