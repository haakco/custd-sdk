<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReferralReviewPage
{
    /**
     * @param  list<ReferralReviewItem>  $reviews
     */
    public function __construct(
        public array $reviews,
        public ?string $nextBefore = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ReferralReviewItem::fromPayload(...), Fields::optionalObjects($payload, 'reviews') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
