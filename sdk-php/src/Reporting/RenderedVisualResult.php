<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class RenderedVisualResult
{
    /**
     * @param list<RenderedAnomaly> $anomalies
     * @param list<RenderedCalibrationBucket> $calibration
     * @param list<RenderedCohortCell> $cohorts
     * @param list<RenderedDistributionBin> $distribution
     * @param list<RenderedDriver> $drivers
     * @param list<RenderedInterval> $intervals
     * @param list<RenderedLifecycleStage> $lifecycle
     * @param list<RenderedQuantile> $quantiles
     */
    public function __construct(
        public string $kind,
        public string $summary,
        public array $anomalies = [],
        public array $calibration = [],
        public array $cohorts = [],
        public array $distribution = [],
        public array $drivers = [],
        public array $intervals = [],
        public array $lifecycle = [],
        public ?string $method = null,
        public array $quantiles = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'summary'),
            array_map(RenderedAnomaly::fromPayload(...), Fields::optionalObjects($payload, 'anomalies') ?? []),
            array_map(RenderedCalibrationBucket::fromPayload(...), Fields::optionalObjects($payload, 'calibration') ?? []),
            array_map(RenderedCohortCell::fromPayload(...), Fields::optionalObjects($payload, 'cohorts') ?? []),
            array_map(RenderedDistributionBin::fromPayload(...), Fields::optionalObjects($payload, 'distribution') ?? []),
            array_map(RenderedDriver::fromPayload(...), Fields::optionalObjects($payload, 'drivers') ?? []),
            array_map(RenderedInterval::fromPayload(...), Fields::optionalObjects($payload, 'intervals') ?? []),
            array_map(RenderedLifecycleStage::fromPayload(...), Fields::optionalObjects($payload, 'lifecycle') ?? []),
            Fields::optionalString($payload, 'method'),
            array_map(RenderedQuantile::fromPayload(...), Fields::optionalObjects($payload, 'quantiles') ?? []),
        );
    }
}
