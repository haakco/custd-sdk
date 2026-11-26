<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFindingDismissal is a dismissed audit finding rule, scoped to one URL when url is set. */
final readonly class SiteFindingDismissal
{
    public function __construct(
        public string $dismissalUuid,
        public string $rule,
        public string $title,
        public string $reason,
        public string $dismissedAt,
        public ?string $url = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'dismissalUuid'),
            Fields::string($payload, 'rule'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'dismissedAt'),
            Fields::optionalString($payload, 'url'),
        );
    }
}
