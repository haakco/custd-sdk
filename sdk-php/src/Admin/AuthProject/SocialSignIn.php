<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * SocialSignIn is the social providers one environment offers; an empty list turns them all off.
 * `status` is read-only: what the sign-in directory offers now and the callback URLs an owner
 * registers with their own provider app. An apply never sends it.
 */
final readonly class SocialSignIn
{
    /** @param list<SocialProvider> $providers */
    public function __construct(
        public array $providers = [],
        public ?SocialSignInStatus $status = null,
    ) {
    }

    /** @return array{providers: list<array<string, string>>} */
    public function toPayload(): array
    {
        return [
            'providers' => array_map(
                static fn (SocialProvider $provider): array => $provider->toPayload(),
                $this->providers,
            ),
        ];
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $status = Fields::optionalObject($payload, 'status');

        return new self(
            array_map(SocialProvider::fromPayload(...), Fields::objects($payload, 'providers')),
            $status === null ? null : SocialSignInStatus::fromPayload($status),
        );
    }
}
