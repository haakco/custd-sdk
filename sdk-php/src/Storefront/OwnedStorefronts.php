<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class OwnedStorefronts
{
    /**
     * @param  list<Binding>  $storefronts
     */
    public function __construct(
        public string $sellerCompanyUuid,
        public array $storefronts,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            array_map(Binding::fromPayload(...), Fields::optionalObjects($payload, 'storefronts') ?? []),
        );
    }
}
