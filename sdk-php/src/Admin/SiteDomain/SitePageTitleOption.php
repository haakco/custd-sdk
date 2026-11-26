<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePageTitleOption is a title built from one ranking query; options are ranked by its impressions. */
final readonly class SitePageTitleOption
{
    public const TEMPLATE_GENERAL = 'general';
    public const TEMPLATE_GUIDE = 'guide';

    /**
     * @param SiteTitleTemplate::* $template
     */
    public function __construct(
        public string $title,
        public string $template,
        public string $query,
        public int $impressions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            Fields::string($payload, 'template'),
            Fields::string($payload, 'query'),
            Fields::integer($payload, 'impressions'),
        );
    }
}
