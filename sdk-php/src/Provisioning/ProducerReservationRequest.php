<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** ProducerReservationRequest holds a producer slug in a data space for ttlSeconds, until it is claimed. */
final readonly class ProducerReservationRequest
{
    public function __construct(
        public string $producerSlug,
        public int $ttlSeconds,
    ) {
    }

    /** @return array{producerSlug: string, ttlSeconds: int} */
    public function serialise(): array
    {
        return ['producerSlug' => $this->producerSlug, 'ttlSeconds' => $this->ttlSeconds];
    }
}
