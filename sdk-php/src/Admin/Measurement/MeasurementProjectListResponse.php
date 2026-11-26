<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementProjectListResponse
{
    /**
     * @param list<MeasurementProject> $projects
     */
    public function __construct(
        public array $projects,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementProject::fromPayload(...), Fields::objects($payload, 'projects')),
        );
    }
}
