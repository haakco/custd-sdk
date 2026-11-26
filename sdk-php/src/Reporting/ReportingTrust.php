<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Retryability;

final readonly class ReportingTrust
{
    /**
     * @param list<string> $queryWarnings
     * @param DataFreshness::* $dataFreshness
     * @param Retryability::* $retryability
     * @param ReportingTrustStatus::* $status
     */
    public function __construct(
        public string $captureState,
        public string $consentState,
        public string $coverage,
        public string $dataFreshness,
        public string $exportState,
        public ReportingNextActionHint $nextAction,
        public string $retryability,
        public string $rollupState,
        public string $status,
        public ?string $contractVersion = null,
        public ?string $lastExport = null,
        public ?string $partialReason = null,
        public ?string $permissionClass = null,
        public array $queryWarnings = [],
        public ?string $schemaVersion = null,
        public ?string $unavailableReason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'captureState'),
            Fields::string($payload, 'consentState'),
            Fields::string($payload, 'coverage'),
            Fields::string($payload, 'dataFreshness'),
            Fields::string($payload, 'exportState'),
            ReportingNextActionHint::fromPayload(Fields::object($payload, 'nextAction')),
            Fields::string($payload, 'retryability'),
            Fields::string($payload, 'rollupState'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'contractVersion'),
            Fields::optionalString($payload, 'lastExport'),
            Fields::optionalString($payload, 'partialReason'),
            Fields::optionalString($payload, 'permissionClass'),
            Fields::optionalStrings($payload, 'queryWarnings') ?? [],
            Fields::optionalString($payload, 'schemaVersion'),
            Fields::optionalString($payload, 'unavailableReason'),
        );
    }
}
