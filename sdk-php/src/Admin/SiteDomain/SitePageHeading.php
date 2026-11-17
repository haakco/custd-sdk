<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageHeading is one heading, level 1 to 6, in page order. */
final readonly class SitePageHeading
{
    public function __construct(
        public int $level,
        public string $text,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::integer($payload, 'level'), Fields::string($payload, 'text'));
    }
}
