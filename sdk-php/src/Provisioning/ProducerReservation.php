<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** ProducerReservation is one producer slug held in a data space. claimedByClientId is set once claimed. */
final readonly class ProducerReservation
{
    public function __construct(
        public string $producerSlug,
        public string $parentCompanySlug,
        public string $childCompanySlug,
        public string $reservedAt,
        public string $expiresAt,
        public ProducerReservationStatus $status,
        public int $maxTtlSeconds,
        public ?string $claimedByClientId = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'producerSlug'),
            Fields::string($payload, 'parentCompanySlug'),
            Fields::string($payload, 'childCompanySlug'),
            Fields::string($payload, 'reservedAt'),
            Fields::string($payload, 'expiresAt'),
            ProducerReservationStatus::from(Fields::string($payload, 'status')),
            Fields::integer($payload, 'maxTtlSeconds'),
            Fields::optionalString($payload, 'claimedByClientId'),
        );
    }
}
