<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Admin\TimePlan\Dto;
use HaakCo\Custd\Admin\TimePlan\Payload;

/**
 * DurationEvaluationRequest selects one tenant-scoped duration history and an
 * optional immutable prediction version for rolling-origin evaluation.
 *
 * Optional inputs default to null so they are omitted from the body entirely:
 * an empty string or a zero limit would be a value the server has to interpret,
 * whereas an absent key keeps the server's own default.
 *
 * The time-plan Payload helper is reused deliberately: it is the SDK's single
 * payload reader, and a second copy in this namespace would be one more thing to
 * keep in step.
 */
final readonly class DurationEvaluationRequest implements Dto
{
    public function __construct(
        public string $planUuid,
        public string $semanticKey,
        public ?string $predictionVersionUuid = null,
        public ?string $windowStart = null,
        public ?string $asOf = null,
        public ?int $limit = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return Payload::withoutNulls([
            "planUuid" => $this->planUuid,
            "semanticKey" => $this->semanticKey,
            "predictionVersionUuid" => $this->predictionVersionUuid,
            "windowStart" => $this->windowStart,
            "asOf" => $this->asOf,
            "limit" => $this->limit,
        ]);
    }
}
