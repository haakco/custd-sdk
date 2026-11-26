<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class DurationEvaluationVersionHistoryEntry
{
    public function __construct(
        public string $actor,
        public string $fromStatus,
        public string $reason,
        public string $toStatus,
        public string $transitionKind,
        public string $transitionedAt,
        public string $versionUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'actor'),
            Fields::string($payload, 'fromStatus'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'toStatus'),
            Fields::string($payload, 'transitionKind'),
            Fields::string($payload, 'transitionedAt'),
            Fields::string($payload, 'versionUuid'),
        );
    }
}
