<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * AuthDomainImageOverrideStatus is the time-boxed image exception recorded for one realm component.
 * `endedAt` and `endedBy` are set once the exception ended.
 */
final readonly class AuthDomainImageOverrideStatus
{
    public function __construct(
        public string $component,
        public string $imageDigest,
        public string $incidentReference,
        public string $actorKind,
        public string $receiptId,
        public string $state,
        public string $setAt,
        public string $expiresAt,
        public ?string $actorSubject = null,
        public ?string $endedAt = null,
        public ?string $endedBy = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'component'),
            Fields::string($payload, 'imageDigest'),
            Fields::string($payload, 'incidentReference'),
            Fields::string($payload, 'actorKind'),
            Fields::string($payload, 'receiptId'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'setAt'),
            Fields::string($payload, 'expiresAt'),
            Fields::optionalString($payload, 'actorSubject'),
            Fields::optionalString($payload, 'endedAt'),
            Fields::optionalString($payload, 'endedBy'),
        );
    }
}
