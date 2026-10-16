<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationPrincipalListItem addresses one application principal admitted to
 * one directory.
 *
 * `providerSubject` is the opaque management address the principal routes take;
 * `principalId` is the application identity UUID it resolves to.
 */
final readonly class ApplicationPrincipalListItem
{
    public function __construct(
        public string $principalId = '',
        public string $directoryId = '',
        public string $providerSubject = '',
        public bool $enabled = false,
    ) {
    }

    /** @param \stdClass $payload */
    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'principalId'),
            Fields::string($payload, 'directoryId'),
            Fields::string($payload, 'providerSubject'),
            Fields::boolean($payload, 'enabled'),
        );
    }
}
