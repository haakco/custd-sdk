<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * AuthDomainImages reports the identity a realm should run against the identity
 * it was observed running. A paused, retiring or retired realm runs no container,
 * so it reports `not-running` with no running identity rather than reading as
 * drift; a realm no observation has confirmed reports `unverified`. `source` is where the
 * expected identity came from (`release-default`, `override` or `undeclared`), and `override` is
 * the image exception behind an `override` source.
 */
final readonly class AuthDomainImages
{
    public function __construct(
        public AuthDomainImageSet $expected,
        public AuthDomainImageSet $running,
        public string $convergence,
        public string $source = '',
        public ?AuthDomainImageOverrideStatus $override = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $override = Fields::optionalObject($payload, "override");

        return new self(
            AuthDomainImageSet::fromPayload(Fields::object($payload, "expected")),
            AuthDomainImageSet::fromPayload(Fields::object($payload, "running")),
            Fields::string($payload, "convergence"),
            Fields::string($payload, "source"),
            $override === null ? null : AuthDomainImageOverrideStatus::fromPayload($override),
        );
    }
}
