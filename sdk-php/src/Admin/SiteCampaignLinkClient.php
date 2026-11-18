<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteCampaignLink;
use HaakCo\Custd\Admin\SiteDomain\SiteCampaignLinkList;
use HaakCo\Custd\Admin\SiteDomain\SiteCampaignLinkRequest;

/**
 * SiteCampaignLinkClient keeps a domain's saved UTM campaign links. It is reached through
 * SiteDomainClient::campaignLinks(). A system administrator names the tenant with the company
 * slug; a tenant credential leaves it null.
 */
final class SiteCampaignLinkClient
{
    /** The problem code of the 409 returned when the domain already has an active link with this tagged URL. */
    public const CAMPAIGN_LINK_TAKEN_CODE = 'site_campaign_link_taken';

    /** The problem code of the 409 returned once the domain keeps SiteCampaignLinkList::MAX_LINKS active links. */
    public const CAMPAIGN_LINK_LIMIT_CODE = 'site_campaign_link_limit';

    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** List the domain's active links, newest first, and archived ones too with $includeArchived. */
    public function listCampaignLinks(
        string $domainUuid,
        bool $includeArchived = false,
        ?string $companySlug = null,
    ): SiteCampaignLinkList {
        $query = $includeArchived ? ['archived' => 'true'] : [];

        return SiteCampaignLinkList::fromPayload($this->http->send('GET', self::path($domainUuid), $query, $companySlug));
    }

    /**
     * Save a tagged page link (201). A second active copy throws {@see self::CAMPAIGN_LINK_TAKEN_CODE},
     * a full domain {@see self::CAMPAIGN_LINK_LIMIT_CODE} and a page on another host
     * {@see SiteDomainClient::PAGE_NOT_ON_DOMAIN_CODE}.
     */
    public function createCampaignLink(
        string $domainUuid,
        SiteCampaignLinkRequest $request,
        ?string $companySlug = null,
    ): SiteCampaignLink {
        return SiteCampaignLink::fromPayload(
            $this->http->send('POST', self::path($domainUuid), [], $companySlug, $request->serialise())
        );
    }

    /** Archive a link: it stays listed with archived links and its tagged URL is free again. */
    public function archiveCampaignLink(string $domainUuid, string $linkUuid, ?string $companySlug = null): SiteCampaignLink
    {
        $path = self::path($domainUuid) . '/' . rawurlencode($linkUuid) . '/archive';

        return SiteCampaignLink::fromPayload($this->http->send('POST', $path, [], $companySlug));
    }

    private static function path(string $domainUuid): string
    {
        return SiteDomainHttp::item($domainUuid) . '/campaign-links';
    }
}
