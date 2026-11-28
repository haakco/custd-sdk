<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class ReferralReviewRetry
{
    public function __construct(
        public string $attributionUuid,
        public ReferralRetryStatus $status,
        public int $requeuedCount,
        public bool $hasMore,
        public ?string $failureCode = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'attributionUuid'),
            ReferralRetryStatus::from(Fields::string($payload, 'status')),
            Fields::integer($payload, 'requeuedCount'),
            Fields::boolean($payload, 'hasMore'),
            Fields::optionalString($payload, 'failureCode'),
        );
    }
}
