<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** DataSpaceErasure is the erasure request for one data space and how far it has got. */
final readonly class DataSpaceErasure
{
    public function __construct(
        public string $requestUuid,
        public string $dataSpaceSlug,
        public string $parentCompanySlug,
        public DataSpaceErasureStatus $status,
        public string $requestedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'requestUuid'),
            Fields::string($payload, 'dataSpaceSlug'),
            Fields::string($payload, 'parentCompanySlug'),
            DataSpaceErasureStatus::from(Fields::string($payload, 'status')),
            Fields::string($payload, 'requestedAt'),
        );
    }
}
