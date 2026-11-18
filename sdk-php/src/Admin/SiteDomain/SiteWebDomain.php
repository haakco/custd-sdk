<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteWebDomain is one of a Site's own or competitor domains and its public web-data inventory.
 * role is a ROLE_* value; trancoBand a TRANCO_* value, with trancoRank null when unranked or unknown;
 * sitemapStatus and waybackStatus are INVENTORY_* values. inventoryAt is null before the first full pass.
 */
final readonly class SiteWebDomain
{
    public const ROLE_OWN = 'own';
    public const ROLE_COMPETITOR = 'competitor';
    public const TRANCO_TOP_1K = 'top-1k';
    public const TRANCO_TOP_10K = 'top-10k';
    public const TRANCO_TOP_100K = 'top-100k';
    public const TRANCO_TOP_1M = 'top-1m';
    public const TRANCO_UNRANKED = 'unranked';
    public const TRANCO_UNKNOWN = 'unknown';
    public const INVENTORY_PENDING = 'pending';
    public const INVENTORY_DONE = 'done';
    public const INVENTORY_PARTIAL = 'partial';
    public const INVENTORY_UNAVAILABLE = 'unavailable';
    public const INVENTORY_FAILED = 'failed';

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
