<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFinding is one problem an audit found on a verified domain, with the fix. */
final readonly class SiteFinding
{
    public function __construct(
        public string $findingUuid,
        public string $rule,
        public string $severity,
        public string $title,
        public string $url,
        public string $evidence,
        public string $fix,
        public string $source,
        public SiteFindingHistory $history,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'findingUuid'),
            Fields::string($payload, 'rule'),
            Fields::string($payload, 'severity'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'evidence'),
            Fields::string($payload, 'fix'),
            Fields::string($payload, 'source'),
            SiteFindingHistory::fromPayload(Fields::object($payload, 'history')),
        );
    }
}
