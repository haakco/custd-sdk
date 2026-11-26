<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class ProjectEstimateListResponse
{
    /**
     * @param list<ProjectEstimate> $estimates
     */
    public function __construct(
        public array $estimates,
        public ?string $deliveryTargetDate = null,
        public ?ProjectEstimateStatus $latest = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $latest = Fields::optionalObject($payload, 'latest');

        return new self(
            array_map(ProjectEstimate::fromPayload(...), Fields::objects($payload, 'estimates')),
            Fields::optionalString($payload, 'deliveryTargetDate'),
            $latest === null ? null : ProjectEstimateStatus::fromPayload($latest),
        );
    }
}
