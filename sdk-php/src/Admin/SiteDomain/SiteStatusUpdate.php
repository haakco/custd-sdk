<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusUpdate is a message published on the status page. */
final readonly class SiteStatusUpdate
{
    public function __construct(
        public string $message,
        public string $publishedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'message'), Fields::string($payload, 'publishedAt'));
    }
}
