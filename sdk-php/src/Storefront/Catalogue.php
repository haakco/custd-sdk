<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Catalogue
{
    /**
     * @param  list<Offer>  $offers
     */
    public function __construct(
        public array $offers,
        public bool $canPublish,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Offer::fromPayload(...), Fields::objects($payload, 'offers')),
            Fields::boolean($payload, 'canPublish'),
        );
    }
}
