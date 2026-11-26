<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class TemporalTrust
{
    /**
     * @param list<string> $warnings
     */
    public function __construct(
        public ?string $calculationVersion = null,
        public ?string $coverageEnd = null,
        public ?string $coverageStart = null,
        public ?int $freshnessMs = null,
        public ?ReconciliationResult $reconciliation = null,
        public ?SourceRange $sourceRange = null,
        public array $warnings = [],
        public ?float $windowCoverage = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $reconciliation = Fields::optionalObject($payload, 'reconciliation');
        $sourceRange = Fields::optionalObject($payload, 'sourceRange');

        return new self(
            Fields::optionalString($payload, 'calculationVersion'),
            Fields::optionalString($payload, 'coverageEnd'),
            Fields::optionalString($payload, 'coverageStart'),
            Fields::optionalInteger($payload, 'freshnessMs'),
            $reconciliation === null ? null : ReconciliationResult::fromPayload($reconciliation),
            $sourceRange === null ? null : SourceRange::fromPayload($sourceRange),
            Fields::optionalStrings($payload, 'warnings') ?? [],
            Fields::optionalNumber($payload, 'windowCoverage'),
        );
    }
}
