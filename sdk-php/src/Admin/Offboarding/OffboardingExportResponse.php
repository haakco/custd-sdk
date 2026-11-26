<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class OffboardingExportResponse
{
    public function __construct(
        public int $byteSize,
        public string $checksumSha256,
        public string $expiresAt,
        public string $generatedAt,
        public string $previewInventoryDigest,
        public int $recordCount,
        public string $requestUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'byteSize'),
            Fields::string($payload, 'checksumSha256'),
            Fields::string($payload, 'expiresAt'),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'previewInventoryDigest'),
            Fields::integer($payload, 'recordCount'),
            Fields::string($payload, 'requestUuid'),
        );
    }
}
