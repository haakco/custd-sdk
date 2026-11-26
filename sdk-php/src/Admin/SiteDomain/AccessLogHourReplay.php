<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * AccessLogHourReplay is a queued re-read of one UTC hour of access logs; previousStatus is how the hour
 * stood before (an AccessLogHourStatus value).
 */
final readonly class AccessLogHourReplay
{
    /**
     * @param AccessLogHourStatus::* $previousStatus
     */
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
