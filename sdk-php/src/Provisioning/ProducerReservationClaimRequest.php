<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** ProducerReservationClaimRequest binds a reserved producer slug to the client that now owns it. */
final readonly class ProducerReservationClaimRequest
{
    public function __construct(public string $claimedByClientId)
    {
    }

    /** @return array{claimedByClientId: string} */
    public function serialise(): array
    {
        return ['claimedByClientId' => $this->claimedByClientId];
    }
}
