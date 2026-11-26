<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Admin\TimePlanOperations\CompletedDurationReportAnnotationInput;

final readonly class CompletedRunExportAnnotationsActionsSection
{
    /**
     * @param list<CompletedDurationReportAnnotationInput> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'items' => array_map(static fn (CompletedDurationReportAnnotationInput $item): array => $item->serialise(), $this->items),
        ];

        return $body;
    }
}
