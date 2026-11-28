<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageTariffPage
{
    /**
     * @param  list<UsageTariffRevision>  $tariffs
     */
    public function __construct(
        public array $tariffs,
        public ?string $nextBefore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(UsageTariffRevision::fromPayload(...), Fields::optionalObjects($payload, 'tariffs') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
