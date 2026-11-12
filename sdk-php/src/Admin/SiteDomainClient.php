<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\CreateSiteDomainRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteCheckMode;
use HaakCo\Custd\Admin\SiteDomain\SiteDomain;
use HaakCo\Custd\Admin\SiteDomain\SiteDomainList;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingList;
use HaakCo\Custd\Admin\SiteDomain\SiteFindingState;
use HaakCo\Custd\Admin\SiteDomain\SiteIncidentList;
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
        $query = $siteUuid === null || $siteUuid === '' ? [] : ['siteUuid' => $siteUuid];

        return SiteDomainList::fromPayload($this->send('GET', self::COLLECTION, $query, $companySlug));
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

    /** List a domain's recent outages, newest first (at most twenty). */
    public function listIncidents(string $domainUuid, ?string $companySlug = null): SiteIncidentList
    {
        return SiteIncidentList::fromPayload(
            $this->send('GET', self::item($domainUuid) . '/incidents', [], $companySlug)
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
