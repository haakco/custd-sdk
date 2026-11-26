<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** SigningProducerStatus is one signing producer of a data space: its keys and its refusals. */
final readonly class SigningProducerStatus
{
    /**
     * @param SigningProducerState::* $state
     * @param list<string> $keyFingerprints sha256 fingerprints, `sha256:<hex>`
     */
    public function __construct(
        public string $clientId,
        public string $state,
        public array $keyFingerprints,
        public SigningRefusalCounts $refusals,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'state'),
            Fields::strings($payload, 'keyFingerprints'),
            SigningRefusalCounts::fromPayload(Fields::object($payload, 'refusals')),
        );
    }
}
