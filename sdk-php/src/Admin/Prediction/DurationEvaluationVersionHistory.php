<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationEvaluationVersionHistory
{
    /**
     * @param list<DurationEvaluationVersionHistoryEntry> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DurationEvaluationVersionHistoryEntry::fromPayload(...), Fields::objects($payload, 'items')),
        );
    }
}
