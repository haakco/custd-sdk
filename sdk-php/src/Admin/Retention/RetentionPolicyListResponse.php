<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionPolicyListResponse
{
    /**
     * @param list<RetentionPolicy> $policies
     */
    public function __construct(
        public array $policies,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(RetentionPolicy::fromPayload(...), Fields::objects($payload, 'policies')),
        );
    }
}
