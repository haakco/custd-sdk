<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** HostingStatus is a hosted environment's derived serving identity. `signIn` is null unless sign_in is on. */
final readonly class HostingStatus
{
    public function __construct(
        public string $host,
        public string $origin,
        public ?HostedSignIn $signIn = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $signIn = Fields::optionalObject($payload, 'signIn');

        return new self(
            Fields::string($payload, 'host'),
            Fields::string($payload, 'origin'),
            $signIn === null ? null : HostedSignIn::fromPayload($signIn),
        );
    }
}
