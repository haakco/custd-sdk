<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class ProjectEstimateStatus
{
    public function __construct(
        public float $ageDays,
        public ProjectEstimate $estimate,
        public ?float $chanceByDeliveryTarget = null,
        public ?float $movementDays = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'ageDays'),
            ProjectEstimate::fromPayload(Fields::object($payload, 'estimate')),
            Fields::optionalNumber($payload, 'chanceByDeliveryTarget'),
            Fields::optionalNumber($payload, 'movementDays'),
        );
    }
}
