<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** The field collection period and available 75th-percentile Web Vitals. */
final readonly class SiteChromeUxObservation
{
    public function __construct(
        public string $firstDate,
        public string $lastDate,
        public ?float $lcpMs,
        public ?float $inpMs,
        public ?float $cls,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'firstDate'),
            Fields::string($payload, 'lastDate'),
            Fields::optionalNumber($payload, 'lcpMs'),
            Fields::optionalNumber($payload, 'inpMs'),
            Fields::optionalNumber($payload, 'cls'),
        );
    }
}
