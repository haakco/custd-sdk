<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SupportAccess;

use HaakCo\Custd\Fields;

/**
 * ImpersonationSession is an operator acting as one of a tenant's users, until it is stopped or expires.
 */
final readonly class ImpersonationSession
{
    public function __construct(
        public string $sessionUuid,
        public string $companySlug,
        public string $targetUserUuid,
        public string $reason,
        public string $consentState,
        public string $startedAt,
        public string $expiresAt,
        public ?string $targetUserEmail = null,
        public ?string $stoppedAt = null,
        public ?string $stopReason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sessionUuid'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'targetUserUuid'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'consentState'),
            Fields::string($payload, 'startedAt'),
            Fields::string($payload, 'expiresAt'),
            Fields::optionalString($payload, 'targetUserEmail'),
            Fields::optionalString($payload, 'stoppedAt'),
            Fields::optionalString($payload, 'stopReason'),
        );
    }
}
