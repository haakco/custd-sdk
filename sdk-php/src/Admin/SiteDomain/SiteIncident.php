<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteIncident is one outage, from the first failed check until the first check
 * that passed. resolvedAt is null while it is open.
 */
final readonly class SiteIncident
{
    public function __construct(
        public string $incidentUuid,
        public string $startedAt,
        public string $openedAt,
        public string $cause,
        public int $failedChecks,
        public ?string $resolvedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'incidentUuid'),
            Fields::string($payload, 'startedAt'),
            Fields::string($payload, 'openedAt'),
            Fields::string($payload, 'cause'),
            Fields::integer($payload, 'failedChecks'),
            Fields::optionalString($payload, 'resolvedAt'),
        );
    }
}
