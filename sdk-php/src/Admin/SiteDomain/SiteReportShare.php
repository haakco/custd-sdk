<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteReportShare is a live share link; reportUuid names the saved report it opens, null for the live report. */
final readonly class SiteReportShare
{
    public function __construct(
        public string $shareUuid,
        public string $createdAt,
        public string $expiresAt,
        public ?string $reportUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'shareUuid'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'expiresAt'),
            Fields::optionalString($payload, 'reportUuid'),
        );
    }
}
