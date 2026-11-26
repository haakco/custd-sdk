<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\Data\ExecutiveComparisonBasis;

/** ExecutiveComparisonResult is the headline's comparison; the values are null while it is unavailable. */
final readonly class ExecutiveComparisonResult
{
    /**
     * @param ExecutiveComparisonBasis::* $basis
     */
    public function __construct(
        public string $basis,
        public string $label,
        public bool $available,
        public ?RenderedMetricValue $value = null,
        public ?float $percentChange = null,
        public ?float $targetValue = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $value = Fields::optionalObject($payload, 'value');

        return new self(
            Fields::string($payload, 'basis'),
            Fields::string($payload, 'label'),
            Fields::boolean($payload, 'available'),
            $value === null ? null : RenderedMetricValue::fromPayload($value),
            Fields::optionalNumber($payload, 'percentChange'),
            Fields::optionalNumber($payload, 'targetValue'),
        );
    }
}
