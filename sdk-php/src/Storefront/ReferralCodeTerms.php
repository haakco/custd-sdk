<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReferralCodeTerms
{
    /**
     * @param  list<ReferralTermsVersion>  $versions
     */
    public function __construct(
        public array $versions,
        public ?string $code = null,
        public ?string $businessTimeZone = null,
        public ?string $nextBefore = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ReferralTermsVersion::fromPayload(...), Fields::optionalObjects($payload, 'versions') ?? []),
            Fields::optionalString($payload, 'code'),
            Fields::optionalString($payload, 'businessTimeZone'),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
