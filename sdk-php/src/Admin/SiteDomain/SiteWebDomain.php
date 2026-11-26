<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWebDomain is one of a Site's own or competitor domains and its public web-data inventory.
 * role is a SiteWebDomainRole value; trancoBand a SiteTrancoBand value, with trancoRank null when unranked or unknown;
 * sitemapStatus and waybackStatus are SiteWebInventoryStatus values. inventoryAt is null before the first full pass.
 */
final readonly class SiteWebDomain
{
    /**
     * @param SiteWebDomainRole::* $role
     * @param SiteWebInventoryStatus::* $sitemapStatus
     * @param SiteWebInventoryStatus::* $waybackStatus
     * @param SiteTrancoBand::* $trancoBand
     */
    public function __construct(
        public string $domain,
        public string $role,
        public string $trancoBand,
        public string $sitemapStatus,
        public string $waybackStatus,
        public int $pageCount,
        public string $nextInventoryAt,
        public ?int $trancoRank = null,
        public ?string $trancoListDay = null,
        public ?string $lastFailure = null,
        public ?string $inventoryAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::string($payload, 'role'),
            Fields::string($payload, 'trancoBand'),
            Fields::string($payload, 'sitemapStatus'),
            Fields::string($payload, 'waybackStatus'),
            Fields::integer($payload, 'pageCount'),
            Fields::string($payload, 'nextInventoryAt'),
            Fields::optionalInteger($payload, 'trancoRank'),
            Fields::optionalString($payload, 'trancoListDay'),
            Fields::optionalString($payload, 'lastFailure'),
            Fields::optionalString($payload, 'inventoryAt'),
        );
    }
}
