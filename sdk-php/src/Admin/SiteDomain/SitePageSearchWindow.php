<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageSearchWindow is the imported days (YYYY-MM-DD) a page's queries come from, and the provider. */
final readonly class SitePageSearchWindow
{
    public function __construct(
        public string $provider,
        public string $from,
        public string $to,
        public string $importedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'from'),
            Fields::string($payload, 'to'),
            Fields::string($payload, 'importedAt'),
        );
    }
}
