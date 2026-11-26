<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteMaintenanceWindow is a one-off maintenance window on a verified domain. cancelledAt is set once cancelled. */
final readonly class SiteMaintenanceWindow
{
    public function __construct(
        public string $windowUuid,
        public string $startsAt,
        public string $endsAt,
        public ?string $cancelledAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'windowUuid'),
            Fields::string($payload, 'startsAt'),
            Fields::string($payload, 'endsAt'),
            Fields::optionalString($payload, 'cancelledAt'),
        );
    }
}
