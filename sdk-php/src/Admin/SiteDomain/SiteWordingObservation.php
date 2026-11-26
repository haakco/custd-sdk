<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Availability and time of the latest checked copy of a page. */
final readonly class SiteWordingObservation
{
    /** @param WordingObservationState::* $state */
    public function __construct(public string $state, public ?string $observedAt)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'observedAt'),
        );
    }
}
