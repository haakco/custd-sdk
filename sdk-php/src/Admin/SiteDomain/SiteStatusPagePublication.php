<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusPagePublication identifies a published status page. */
final readonly class SiteStatusPagePublication
{
    public function __construct(
        public string $publicKey,
        public string $publishedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'publicKey'), Fields::string($payload, 'publishedAt'));
    }

    /**
     * The link customers open, on the Custd panel origin (https://custd.com in production). The key
     * stays in the fragment, so it is never sent to a server or written to an access log.
     */
    public function publicUrl(string $panelOrigin): string
    {
        return rtrim($panelOrigin, '/') . '/status-page#' . $this->publicKey;
    }
}
