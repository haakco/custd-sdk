<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceSigningStatus is whether a data space's signing producers can deliver events. */
final readonly class DataSpaceSigningStatus
{
    /**
     * @param DataSpaceSigningState::* $state
     * @param list<SigningProducerStatus> $producers
     */
    public function __construct(
        public string $dataSpaceSlug,
        public string $parentCompanySlug,
        public string $state,
        public array $producers,
        public ?string $erasedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'dataSpaceSlug'),
            Fields::string($payload, 'parentCompanySlug'),
            Fields::string($payload, 'state'),
            array_map(SigningProducerStatus::fromPayload(...), Fields::objects($payload, 'producers')),
            Fields::optionalString($payload, 'erasedAt'),
        );
    }
}
