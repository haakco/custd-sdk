<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAnalyticsRow is one landing page path, key event name or channel group with its GA4 numbers.
 * A number GA4 did not report is null, never 0.
 */
final readonly class SiteAnalyticsRow
{
    public function __construct(
        public string $key,
        public ?int $sessions = null,
        public ?int $engagedSessions = null,
        public ?float $keyEvents = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::optionalInteger($payload, 'sessions'),
            Fields::optionalInteger($payload, 'engagedSessions'),
            Fields::optionalNumber($payload, 'keyEvents'),
        );
    }
}
