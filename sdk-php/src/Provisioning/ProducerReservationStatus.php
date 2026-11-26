<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** ProducerReservationStatus is where a producer reservation is in its life. */
enum ProducerReservationStatus: string
{
    case Pending = 'pending';
    case Claimed = 'claimed';
    case Released = 'released';
    case Expired = 'expired';
}
