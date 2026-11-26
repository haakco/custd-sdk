<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** ProducerReservationStatus is where a producer reservation is in its life. */
final class ProducerReservationStatus
{
    public const PENDING = 'pending';
    public const CLAIMED = 'claimed';
    public const RELEASED = 'released';
    public const EXPIRED = 'expired';
}
