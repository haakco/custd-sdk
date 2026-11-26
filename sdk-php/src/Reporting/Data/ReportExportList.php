<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class ReportExportList
{
    /**
     * @param list<JobResponse> $exports
     */
    public function __construct(
        public array $exports,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(JobResponse::fromPayload(...), Fields::objects($payload, 'exports')),
        );
    }
}
