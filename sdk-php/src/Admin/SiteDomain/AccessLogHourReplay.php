<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * AccessLogHourReplay is a queued re-read of one UTC hour of access logs; previousStatus is how the hour
 * stood before (a PREVIOUS_* value).
 */
final readonly class AccessLogHourReplay
{
    public const PREVIOUS_DONE = 'done';
    public const PREVIOUS_PARTIAL = 'partial';
    public const PREVIOUS_FAILED = 'failed';
    public const PREVIOUS_MISSING = 'missing';

    public function __construct(
        public string $hourStart,
        public string $previousStatus,
        public string $requestedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'hourStart'),
            Fields::string($payload, 'previousStatus'),
            Fields::string($payload, 'requestedAt'),
        );
    }
}
