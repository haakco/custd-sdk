<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageFinding is one problem a draft page check found. Unlike SiteFinding it is never
 * stored, so it has no finding UUID or history.
 */
final readonly class SitePageFinding
{
    /**
     * @param SiteFindingSeverity::* $severity
     */
    public function __construct(
        public string $rule,
        public string $severity,
        public string $title,
        public string $url,
        public string $evidence,
        public string $fix,
        public string $source,
        public SiteRemedy $remedy,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'rule'),
            Fields::string($payload, 'severity'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'evidence'),
            Fields::string($payload, 'fix'),
            Fields::string($payload, 'source'),
            SiteRemedy::fromPayload(Fields::object($payload, 'remedy')),
        );
    }
}
