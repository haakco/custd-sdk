<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyErasureListResponse
{
    /**
     * @param list<PrivacyErasureResponse> $requests
     */
    public function __construct(
        public array $requests,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PrivacyErasureResponse::fromPayload(...), Fields::objects($payload, 'requests')),
        );
    }
}
