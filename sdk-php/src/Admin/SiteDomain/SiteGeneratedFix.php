<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteGeneratedFix is ready-to-copy code that fixes one finding. */
final readonly class SiteGeneratedFix
{
    public const FORMAT_HTML = 'html';
    public const FORMAT_ROBOTS_TXT = 'robots.txt';

    public function __construct(
        public string $format,
        public string $code,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'format'), Fields::string($payload, 'code'));
    }
}
