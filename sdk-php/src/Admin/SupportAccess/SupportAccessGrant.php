<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

use HaakCo\Custd\Fields;

final readonly class SupportAccessGrant
{
    public function __construct(
        public string $companySlug,
        public string $expiresAt,
        public string $operatorUserUuid,
        public string $reason,
        public string $startsAt,
        public string $supportAccessGrantUuid,
        public ?string $revokedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'expiresAt'),
            Fields::string($payload, 'operatorUserUuid'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'startsAt'),
            Fields::string($payload, 'supportAccessGrantUuid'),
            Fields::optionalString($payload, 'revokedAt'),
        );
    }
}
