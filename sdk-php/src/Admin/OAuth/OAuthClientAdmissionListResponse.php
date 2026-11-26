<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientAdmissionListResponse
{
    /**
     * @param list<OAuthClientAdmission> $admissions
     */
    public function __construct(
        public array $admissions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(OAuthClientAdmission::fromPayload(...), Fields::objects($payload, 'admissions')),
        );
    }
}
