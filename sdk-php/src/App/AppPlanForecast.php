<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppPlanForecast
{
    /**
     * @param list<string> $missingParts
     * @param list<PlanProgressPoint> $observedProgress
     * @param list<PlanProgressBand> $projectedProgress
     */
    public function __construct(
        public string $asOf,
        public int $completedParts,
        public string $horizon,
        public array $missingParts,
        public string $model,
        public array $observedProgress,
        public array $projectedProgress,
        public int $requiredParts,
        public int $revision,
        public ?float $deadlineProbability = null,
        public ?float $horizonMissFraction = null,
        public ?string $lower = null,
        public ?string $median = null,
        public ?string $previousMedian = null,
        public ?string $upper = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'asOf'),
            Fields::integer($payload, 'completedParts'),
            Fields::string($payload, 'horizon'),
            Fields::strings($payload, 'missingParts'),
            Fields::string($payload, 'model'),
            array_map(PlanProgressPoint::fromPayload(...), Fields::objects($payload, 'observedProgress')),
            array_map(PlanProgressBand::fromPayload(...), Fields::objects($payload, 'projectedProgress')),
            Fields::integer($payload, 'requiredParts'),
            Fields::integer($payload, 'revision'),
            Fields::optionalNumber($payload, 'deadlineProbability'),
            Fields::optionalNumber($payload, 'horizonMissFraction'),
            Fields::optionalString($payload, 'lower'),
            Fields::optionalString($payload, 'median'),
            Fields::optionalString($payload, 'previousMedian'),
            Fields::optionalString($payload, 'upper'),
        );
    }
}
