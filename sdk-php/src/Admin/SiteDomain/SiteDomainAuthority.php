<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteDomainAuthority is a domain's standing in one Common Crawl domain graph release. The ranks,
 * scores and hosts are null when the graph does not hold graphDomain (inGraph false).
 */
final readonly class SiteDomainAuthority
{
    public function __construct(
        public string $release,
        public string $graphDomain,
        public bool $inGraph,
        public ?int $harmonicRank = null,
        public ?float $harmonicCentrality = null,
        public ?int $pageRankRank = null,
        public ?float $pageRank = null,
        public ?int $hosts = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'release'),
            Fields::string($payload, 'graphDomain'),
            Fields::boolean($payload, 'inGraph'),
            Fields::optionalInteger($payload, 'harmonicRank'),
            Fields::optionalNumber($payload, 'harmonicCentrality'),
            Fields::optionalInteger($payload, 'pageRankRank'),
            Fields::optionalNumber($payload, 'pageRank'),
            Fields::optionalInteger($payload, 'hosts'),
        );
    }
}
