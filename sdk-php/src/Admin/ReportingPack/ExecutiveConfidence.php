<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ExecutiveConfidence is how far a reader can trust the headline, in plain words. */
final readonly class ExecutiveConfidence
{
    /** @param list<string> $warnings */
    public function __construct(
        public string $status,
        public string $coverage,
        public string $completeness,
        public string $freshness,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::string($payload, 'coverage'),
            Fields::string($payload, 'completeness'),
            Fields::string($payload, 'freshness'),
            Fields::optionalStrings($payload, 'warnings') ?? [],
        );
    }
}
