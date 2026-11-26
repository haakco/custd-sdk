<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

/**
 * DurationEvaluationVersionEvidence binds an evaluation to the selected version,
 * the active version visible at evaluation time and the version's transition history.
 */
final readonly class DurationEvaluationVersionEvidence
{
    public function __construct(
        public DurationEvaluationVersion $selected,
        public DurationEvaluationVersionHistory $history,
        public ?string $activeVersionUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            DurationEvaluationVersion::fromPayload(Fields::object($payload, 'selected')),
            DurationEvaluationVersionHistory::fromPayload(Fields::object($payload, 'history')),
            Fields::optionalString($payload, 'activeVersionUuid'),
        );
    }
}
