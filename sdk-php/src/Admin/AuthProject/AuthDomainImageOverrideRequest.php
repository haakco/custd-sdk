<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthDomainImageOverrideRequest pins one realm component to an exact incident image identity, for the
 * incident it names, until expiresAt (at most 24 hours after the server's clock). System administrators
 * and the platform operator only.
 */
final readonly class AuthDomainImageOverrideRequest
{
    public function __construct(
        public string $component,
        public string $imageDigest,
        public string $incidentReference,
        public string $expiresAt,
    ) {
    }

    /** @return array{component: string, imageDigest: string, incidentReference: string, expiresAt: string} */
    public function serialise(): array
    {
        return [
            'component' => $this->component,
            'imageDigest' => $this->imageDigest,
            'incidentReference' => $this->incidentReference,
            'expiresAt' => $this->expiresAt,
        ];
    }
}
