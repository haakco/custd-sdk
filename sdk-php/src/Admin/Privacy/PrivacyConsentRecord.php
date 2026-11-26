<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyConsentRecord
{
    public function __construct(
        public bool $granted,
        public string $purpose,
        public string $recordedAt,
        public string $source,
        public string $subjectId,
        public ?string $expiresAt = null,
        public ?string $grantedAt = null,
        public ?string $revokedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'granted'),
            Fields::string($payload, 'purpose'),
            Fields::string($payload, 'recordedAt'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'subjectId'),
            Fields::optionalString($payload, 'expiresAt'),
            Fields::optionalString($payload, 'grantedAt'),
            Fields::optionalString($payload, 'revokedAt'),
        );
    }
}
