<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * AuthDomainImages reports the identity a realm should run against the identity
 * it was observed running. A paused, retiring or retired realm runs no container,
 * so it reports `not-running` with no running identity rather than reading as
 * drift; a realm no observation has confirmed reports `unverified`.
 */
final readonly class AuthDomainImages
{
    public function __construct(
        public AuthDomainImageSet $expected,
        public AuthDomainImageSet $running,
        public string $convergence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AuthDomainImageSet::fromPayload(Fields::object($payload, "expected")),
            AuthDomainImageSet::fromPayload(Fields::object($payload, "running")),
            Fields::string($payload, "convergence"),
        );
    }
}
