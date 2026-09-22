<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationEvaluationVersionEvidence binds an evaluation to the selected version
 * and the active version visible at evaluation time.
 */
final readonly class DurationEvaluationVersionEvidence
{
    public function __construct(
        public DurationEvaluationVersion $selected = new DurationEvaluationVersion(),
        public string $activeVersionUuid = "",
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            DurationEvaluationVersion::fromPayload(Payload::object($payload, "selected")),
            Payload::optionalString($payload, "activeVersionUuid") ?? "",
        );
    }
}
