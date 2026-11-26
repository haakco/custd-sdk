<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SavedSiteReport is a saved report's summary fields and the report content stored at generatedAt. */
final readonly class SavedSiteReport
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
        public SiteReport $report,
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
            SiteReport::fromPayload(Fields::object($payload, 'report')),
        );
    }
}
