<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** A lookup without an observation returned no field data for the origin. */
final readonly class SiteChromeUx
{
    public function __construct(
        public string $checkedAt,
        public ?SiteChromeUxObservation $observation,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $observation = Fields::optionalObject($payload, 'observation');

        return new self(
            Fields::string($payload, 'checkedAt'),
            $observation === null ? null : SiteChromeUxObservation::fromPayload($observation),
        );
    }
}
