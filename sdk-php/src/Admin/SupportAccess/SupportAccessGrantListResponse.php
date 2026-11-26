<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

use HaakCo\Custd\Fields;

final readonly class SupportAccessGrantListResponse
{
    /**
     * @param list<SupportAccessGrant> $grants
     */
    public function __construct(
        public array $grants,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SupportAccessGrant::fromPayload(...), Fields::objects($payload, 'grants')),
        );
    }
}
