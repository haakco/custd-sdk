<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageEnrollmentItem
{
    public function __construct(
        public string $tariffDescription,
        public string $enrollmentUuid,
        public string $tariffRevisionUuid,
        public string $periodStart,
        public string $closeNotBefore,
        public string $status,
        public ?string $dataSpaceCompanyUuid = null,
        public ?string $closedAt = null,
        public ?string $invoiceUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'tariffDescription'),
            Fields::string($payload, 'enrollmentUuid'),
            Fields::string($payload, 'tariffRevisionUuid'),
            Fields::string($payload, 'periodStart'),
            Fields::string($payload, 'closeNotBefore'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'dataSpaceCompanyUuid'),
            Fields::optionalString($payload, 'closedAt'),
            Fields::optionalString($payload, 'invoiceUuid'),
        );
    }
}
