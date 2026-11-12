<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchSource is one provider's totals for the window and the dates (YYYY-MM-DD) they
 * cover. granularity is "daily" or "weekly".
 */
final readonly class SiteSearchSource
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $source,
        public string $granularity,
        public int $days,
        public SiteSearchTotals $totals,
        public ?string $from = null,
        public ?string $to = null,
        public ?string $importedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'granularity'),
            Fields::integer($payload, 'days'),
            SiteSearchTotals::fromPayload(Fields::object($payload, 'totals')),
            Fields::optionalString($payload, 'from'),
            Fields::optionalString($payload, 'to'),
            Fields::optionalString($payload, 'importedAt'),
        );
    }
}
