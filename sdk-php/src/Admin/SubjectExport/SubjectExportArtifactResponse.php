<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SubjectExport;

use HaakCo\Custd\Fields;

final readonly class SubjectExportArtifactResponse
{
    public function __construct(
        public int $byteSize,
        public string $checksumSha256,
        public string $encryptionKeyId,
        public string $expiresAt,
        public string $generatedAt,
        public string $id,
        public string $objectKey,
        public int $recordCount,
        public string $requestId,
        public string $s3Key,
        public string $scope,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'byteSize'),
            Fields::string($payload, 'checksumSha256'),
            Fields::string($payload, 'encryptionKeyId'),
            Fields::string($payload, 'expiresAt'),
            Fields::string($payload, 'generatedAt'),
            Fields::string($payload, 'id'),
            Fields::string($payload, 'objectKey'),
            Fields::integer($payload, 'recordCount'),
            Fields::string($payload, 'requestId'),
            Fields::string($payload, 's3Key'),
            Fields::string($payload, 'scope'),
        );
    }
}
