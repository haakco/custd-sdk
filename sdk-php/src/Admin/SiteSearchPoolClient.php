<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SearchPoolQueryPage;
use HaakCo\Custd\Admin\SiteDomain\SearchPoolSetting;

/**
 * SiteSearchPoolClient joins or leaves the tenant-wide shared search pool and reads its pooled
 * queries. It is reached through SiteDomainClient::searchPool(). A site-bound credential is refused
 * with {@see self::SEARCH_POOL_SITE_BOUND_CODE}. A system administrator names the tenant with the
 * company slug; a tenant credential leaves it null.
 */
final class SiteSearchPoolClient
{
    /** The problem code of the 403 returned when reading the pool's queries before joining it. */
    public const SEARCH_POOL_NOT_JOINED_CODE = 'site_search_pool_not_joined';

    /** The problem code of the 403 returned for any pool call from a credential bound to one Site. */
    public const SEARCH_POOL_SITE_BOUND_CODE = 'site_search_pool_site_bound';

    /** The problem code of the 400 returned for a setting without a true or false joined. */
    public const SEARCH_POOL_SETTING_INVALID_CODE = 'site_search_pool_setting_invalid';

    /** The problem code of the 400 returned for a search over SearchPoolQueryPage::MAX_SEARCH_LENGTH or a bad limit. */
    public const SEARCH_POOL_QUERY_INVALID_CODE = 'site_search_pool_query_invalid';

    private const PATH = SiteDomainHttp::COLLECTION . '/search-pool';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read whether the tenant has joined the pool and the rules pooled queries meet. */
    public function getSearchPool(?string $companySlug = null): SearchPoolSetting
    {
        return SearchPoolSetting::fromPayload($this->http->send('GET', self::PATH, [], $companySlug));
    }

    /** Join (true) or leave (false) the pool. */
    public function setSearchPool(bool $joined, ?string $companySlug = null): SearchPoolSetting
    {
        return SearchPoolSetting::fromPayload(
            $this->http->send('PUT', self::PATH, [], $companySlug, ['joined' => $joined])
        );
    }

    /**
     * Read the pooled queries, optionally narrowed to those containing $search; $limit is 1 to
     * SearchPoolQueryPage::MAX_LIMIT and null uses SearchPoolQueryPage::DEFAULT_LIMIT. A tenant that has
     * not joined is refused with {@see self::SEARCH_POOL_NOT_JOINED_CODE}.
     */
    public function listSearchPoolQueries(
        ?string $search = null,
        ?int $limit = null,
        ?string $companySlug = null,
    ): SearchPoolQueryPage {
        $query = SiteDomainHttp::query(['limit' => $limit, 'search' => $search]);

        return SearchPoolQueryPage::fromPayload(
            $this->http->send('GET', self::PATH . '/queries', $query, $companySlug)
        );
    }
}
