<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerProductTermsPage
{
    /**
     * @param  list<PartnerProductTermsVersion>  $versions
     */
    public function __construct(
        public array $versions,
        public ?string $nextBefore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PartnerProductTermsVersion::fromPayload(...), Fields::optionalObjects($payload, 'versions') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
