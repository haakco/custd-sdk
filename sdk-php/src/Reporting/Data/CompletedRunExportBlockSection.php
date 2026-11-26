<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Admin\TimePlanOperations\CompletedDurationReportBlockInput;

final readonly class CompletedRunExportBlockSection
{
    /**
     * @param list<CompletedDurationReportBlockInput> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'items' => array_map(static fn (CompletedDurationReportBlockInput $item): array => $item->serialise(), $this->items),
        ];

        return $body;
    }
}
