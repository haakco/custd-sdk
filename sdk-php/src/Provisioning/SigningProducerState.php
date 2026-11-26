<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** SigningProducerState is whether a signing producer's events are accepted. */
final class SigningProducerState
{
    public const READY = 'ready';
    public const AWAITING_KEYS = 'awaiting_keys';
    public const CANCELLED = 'cancelled';
}
