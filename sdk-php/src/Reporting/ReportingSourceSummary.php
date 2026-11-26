<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class ReportingSourceSummary
{
    public function __construct(
        public string $completeness,
        public int $count,
        public string $kind,
        public ?string $coverageEnd = null,
        public ?string $coverageStart = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'completeness'),
            Fields::integer($payload, 'count'),
            Fields::string($payload, 'kind'),
            Fields::optionalString($payload, 'coverageEnd'),
            Fields::optionalString($payload, 'coverageStart'),
        );
    }
}
