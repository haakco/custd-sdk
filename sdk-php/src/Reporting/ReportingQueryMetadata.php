<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class ReportingQueryMetadata
{
    public function __construct(
        public int $coveredWindows,
        public int $effectiveMaxRows,
        public string $resolvedTemplate,
        public int $returnedBuckets,
        public int $returnedRows,
        public ?string $rangeEnd = null,
        public ?string $rangeStart = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'coveredWindows'),
            Fields::integer($payload, 'effectiveMaxRows'),
            Fields::string($payload, 'resolvedTemplate'),
            Fields::integer($payload, 'returnedBuckets'),
            Fields::integer($payload, 'returnedRows'),
            Fields::optionalString($payload, 'rangeEnd'),
            Fields::optionalString($payload, 'rangeStart'),
        );
    }
}
