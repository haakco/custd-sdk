<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Availability and time of the latest checked copy of a page. */
final readonly class SiteWordingObservation
{
    public function __construct(public WordingObservationState $state, public ?string $observedAt)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            WordingObservationState::from(Fields::string($payload, 'state')),
            Fields::optionalString($payload, 'observedAt'),
        );
    }
}
