<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerStatement
{
    /**
     * @param  list<PartnerMovement>  $movements
     */
    public function __construct(
        public string $sellerCompanyUuid,
        public string $appUuid,
        public string $partnerCompanyUuid,
        public string $month,
        public array $movements,
        public ?string $nextCursor = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'appUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'month'),
            array_map(PartnerMovement::fromPayload(...), Fields::optionalObjects($payload, 'movements') ?? []),
            Fields::optionalString($payload, 'nextCursor'),
        );
    }
}
