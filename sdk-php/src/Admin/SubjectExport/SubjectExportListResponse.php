<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

use HaakCo\Custd\Fields;

final readonly class SubjectExportListResponse
{
    /**
     * @param list<SubjectExportResponse> $requests
     */
    public function __construct(
        public array $requests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SubjectExportResponse::fromPayload(...), Fields::objects($payload, 'requests')),
        );
    }
}
