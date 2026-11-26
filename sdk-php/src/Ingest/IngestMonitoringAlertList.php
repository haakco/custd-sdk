<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * IngestMonitoringAlertList is the tenant's active ingest alerts.
 */
final readonly class IngestMonitoringAlertList
{
    /**
     * @param list<IngestMonitoringAlert> $alerts
     */
    public function __construct(
        public array $alerts,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(IngestMonitoringAlert::fromPayload(...), Fields::objects($payload, 'alerts')),
        );
    }
}
