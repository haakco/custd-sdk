<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteAuditPageList is one page of the URLs the latest audit crawled; auditedAt is null before the first audit. */
final readonly class SiteAuditPageList
{
    /** The page size the server uses when none is asked for. */
    public const DEFAULT_LIMIT = 50;
    /** The largest page size the server accepts. */
    public const MAX_LIMIT = 200;

    /** @param list<SiteAuditPage> $pages */
    public function __construct(
        public string $domainUuid,
        public bool $truncated,
        public int $offset,
        public int $limit,
        public int $total,
        public array $pages,
        public ?string $auditedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::boolean($payload, 'truncated'),
            Fields::integer($payload, 'offset'),
            Fields::integer($payload, 'limit'),
            Fields::integer($payload, 'total'),
            array_map(SiteAuditPage::fromPayload(...), Fields::objects($payload, 'pages')),
            Fields::optionalString($payload, 'auditedAt'),
        );
    }
}
