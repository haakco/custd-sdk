<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteContentGap;
use HaakCo\Custd\Admin\SiteDomain\SiteKeywordClusters;
use HaakCo\Custd\Admin\SiteDomain\SiteKeywordList;
use HaakCo\Custd\Admin\SiteDomain\SiteKeywordListRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteKeywordLists;
use HaakCo\Custd\Admin\SiteDomain\SiteTopicTrends;
use HaakCo\Custd\Admin\SiteDomain\SiteWebDomains;
use HaakCo\Custd\Admin\SiteDomain\SiteWebPages;

/**
 * SiteWebDataClient reads a Site's public web data (domain inventory, competitor pages, topic
 * trends, content gaps) and keeps its keyword lists. It is reached through
 * SiteDomainClient::webData(). Every call is Site-scoped: a site-bound credential passes a null
 * Site UUID for its own Site. A system administrator names the tenant with the company slug.
 */
final class SiteWebDataClient
{
    /** The problem code of the 404 returned when the Site has no keyword list of that name. */
    public const KEYWORD_LIST_NOT_FOUND_CODE = 'site_keyword_list_not_found';

    /** The problem code of the 409 returned once the Site keeps the most keyword lists it may. */
    public const KEYWORD_LIST_LIMIT_CODE = 'site_keyword_list_limit';

    private const COLLECTION = SiteDomainHttp::COLLECTION;

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** List the Site's own and competitor domains with their inventory state. */
    public function getWebDomains(?string $siteUuid = null, ?string $companySlug = null): SiteWebDomains
    {
        return SiteWebDomains::fromPayload($this->read('/web-domains', ['siteUuid' => $siteUuid], $companySlug));
    }

    /** Page through one domain's inventoried URLs; pass the previous page's next as $after. */
    public function listWebPages(
        string $domain,
        ?string $siteUuid = null,
        ?string $after = null,
        ?int $limit = null,
        ?string $companySlug = null,
    ): SiteWebPages {
        return SiteWebPages::fromPayload($this->read(
            '/web-pages',
            ['siteUuid' => $siteUuid, 'domain' => $domain, 'after' => $after, 'limit' => $limit],
            $companySlug
        ));
    }

    /** Read the monthly Wikipedia views of the Site's brand names and keyword-list seeds. */
    public function getTopicTrends(?string $siteUuid = null, ?string $companySlug = null): SiteTopicTrends
    {
        return SiteTopicTrends::fromPayload($this->read('/topic-trends', ['siteUuid' => $siteUuid], $companySlug));
    }

    /** Read the topics competitors cover that the Site does not, optionally narrowed to a $seed term. */
    public function getContentGap(
        ?string $siteUuid = null,
        ?string $seed = null,
        ?string $companySlug = null,
    ): SiteContentGap {
        return SiteContentGap::fromPayload(
            $this->read('/content-gap', ['siteUuid' => $siteUuid, 'seed' => $seed], $companySlug)
        );
    }

    public function listKeywordLists(?string $siteUuid = null, ?string $companySlug = null): SiteKeywordLists
    {
        return SiteKeywordLists::fromPayload($this->read('/keyword-lists', ['siteUuid' => $siteUuid], $companySlug));
    }

    /** Create or replace the keyword list of the request's name. A full Site throws {@see self::KEYWORD_LIST_LIMIT_CODE}. */
    public function saveKeywordList(
        SiteKeywordListRequest $request,
        ?string $siteUuid = null,
        ?string $companySlug = null,
    ): SiteKeywordList {
        return SiteKeywordList::fromPayload($this->http->send(
            'PUT',
            self::COLLECTION . '/keyword-lists',
            SiteDomainHttp::siteQuery($siteUuid),
            $companySlug,
            $request->serialise()
        ));
    }

    /** Delete a keyword list. The route returns 204 No Content; an unknown name throws {@see self::KEYWORD_LIST_NOT_FOUND_CODE}. */
    public function deleteKeywordList(string $name, ?string $siteUuid = null, ?string $companySlug = null): void
    {
        $this->http->sendNoContent(
            'DELETE',
            self::COLLECTION . '/keyword-lists',
            SiteDomainHttp::query(['siteUuid' => $siteUuid, 'name' => $name]),
            $companySlug
        );
    }

    /** Group one keyword list into clusters with its search numbers and striking-distance keywords. */
    public function getKeywordClusters(
        string $name,
        ?string $siteUuid = null,
        ?string $companySlug = null,
    ): SiteKeywordClusters {
        return SiteKeywordClusters::fromPayload(
            $this->read('/keyword-clusters', ['siteUuid' => $siteUuid, 'name' => $name], $companySlug)
        );
    }

    /** @param array<string, string|int|null> $parameters */
    private function read(string $route, array $parameters, ?string $companySlug): \stdClass
    {
        return $this->http->send('GET', self::COLLECTION . $route, SiteDomainHttp::query($parameters), $companySlug);
    }
}
