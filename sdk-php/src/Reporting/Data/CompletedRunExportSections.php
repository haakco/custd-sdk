<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Admin\TimePlanOperations\CompletedDurationReportProvenance;
use HaakCo\Custd\Admin\TimePlanOperations\CompletedDurationReportSummary;

final readonly class CompletedRunExportSections
{
    /**
     * @param list<string> $order
     */
    public function __construct(
        public CompletedRunExportAdjustmentSection $adjustments,
        public CompletedRunExportAnnotationsActionsSection $annotationsActions,
        public CompletedRunExportBlockSection $blocks,
        public array $order,
        public CompletedRunExportPredictionComparisonSection $predictionComparison,
        public CompletedDurationReportProvenance $provenance,
        public CompletedDurationReportSummary $summary,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'adjustments' => $this->adjustments->serialise(),
            'annotationsActions' => $this->annotationsActions->serialise(),
            'blocks' => $this->blocks->serialise(),
            'order' => $this->order,
            'predictionComparison' => $this->predictionComparison->serialise(),
            'provenance' => $this->provenance->serialise(),
            'summary' => $this->summary->serialise(),
        ];

        return $body;
    }
}
