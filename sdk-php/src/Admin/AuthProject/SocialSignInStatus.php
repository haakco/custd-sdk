<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** SocialSignInStatus is the observed state of an environment's social providers. */
final readonly class SocialSignInStatus
{
    /**
     * @param list<SocialProviderStatus> $providers
     * @param list<SocialCallbackUrl> $callbackUrls
     */
    public function __construct(
        public array $providers,
        public array $callbackUrls,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SocialProviderStatus::fromPayload(...), Fields::objects($payload, 'providers')),
            array_map(SocialCallbackUrl::fromPayload(...), Fields::objects($payload, 'callbackUrls')),
        );
    }
}
