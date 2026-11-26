<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReport
{
    /**
     * @param list<CompletedDurationReportAdjustmentInput> $adjustments
     * @param list<CompletedDurationReportAnnotationInput> $annotations
     * @param list<CompletedDurationReportBlockInput> $blocks
     * @param list<CompletedDurationReportPredictionComparison> $predictionComparisons
     */
    public function __construct(
        public array $adjustments,
        public array $annotations,
        public array $blocks,
        public array $predictionComparisons,
        public CompletedDurationReportProvenance $provenance,
        public CompletedDurationReportSummary $summary,
        public string $tenantId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(CompletedDurationReportAdjustmentInput::fromPayload(...), Fields::objects($payload, 'adjustments')),
            array_map(CompletedDurationReportAnnotationInput::fromPayload(...), Fields::objects($payload, 'annotations')),
            array_map(CompletedDurationReportBlockInput::fromPayload(...), Fields::objects($payload, 'blocks')),
            array_map(CompletedDurationReportPredictionComparison::fromPayload(...), Fields::objects($payload, 'prediction_comparisons')),
            CompletedDurationReportProvenance::fromPayload(Fields::object($payload, 'provenance')),
            CompletedDurationReportSummary::fromPayload(Fields::object($payload, 'summary')),
            Fields::string($payload, 'tenant_id'),
        );
    }
}
