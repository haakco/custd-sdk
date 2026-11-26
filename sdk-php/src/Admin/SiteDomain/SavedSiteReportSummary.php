<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SavedSiteReportSummary describes one saved report without its content. template is a
 * SiteReport::TEMPLATE_* value; liveShares counts its share links that have not expired.
 */
final readonly class SavedSiteReportSummary
{
    /**
     * @param SiteReportTemplate::* $template
     */
    public function __construct(
        public string $reportUuid,
        public string $name,
        public string $template,
        public int $days,
        public string $generatedAt,
        public string $createdAt,
        public int $liveShares,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'reportUuid'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'template'),
            Fields::integer($payload, 'days'),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'createdAt'),
            Fields::integer($payload, 'liveShares'),
        );
    }
}
