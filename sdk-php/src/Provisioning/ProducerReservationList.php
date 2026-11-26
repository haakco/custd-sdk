<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** ProducerReservationList is a data space's producer reservations. */
final readonly class ProducerReservationList
{
    /** @param list<ProducerReservation> $reservations */
    public function __construct(public array $reservations = [])
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(ProducerReservation::fromPayload(...), Fields::objects($payload, 'reservations')));
    }
}
