<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageEnrollmentPage
{
    /**
     * @param  list<UsageEnrollmentItem>  $enrollments
     */
    public function __construct(
        public bool $canSchedule,
        public array $enrollments,
        public ?string $nextBefore = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'canSchedule'),
            array_map(UsageEnrollmentItem::fromPayload(...), Fields::optionalObjects($payload, 'enrollments') ?? []),
            Fields::optionalString($payload, 'nextBefore'),
        );
    }
}
