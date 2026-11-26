<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** SocialCallbackUrl is the exact callback one provider app must register. */
final readonly class SocialCallbackUrl
{
    public function __construct(
        public string $provider,
        public string $url,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'provider'), Fields::string($payload, 'url'));
    }
}
