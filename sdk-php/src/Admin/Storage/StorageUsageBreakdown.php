<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Storage;

use HaakCo\Custd\Fields;

final readonly class StorageUsageBreakdown
{
    public function __construct(
        public int $dbCoreLogicalBytes,
        public int $dbRawInlineLogicalBytes,
        public string $parquetArchiveAttribution,
        public int $s3ParquetArchiveBytes,
        public int $s3ParquetArchiveObjectCount,
        public int $s3RawBytes,
        public int $s3RawObjectCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'dbCoreLogicalBytes'),
            Fields::integer($payload, 'dbRawInlineLogicalBytes'),
            Fields::string($payload, 'parquetArchiveAttribution'),
            Fields::integer($payload, 's3ParquetArchiveBytes'),
            Fields::integer($payload, 's3ParquetArchiveObjectCount'),
            Fields::integer($payload, 's3RawBytes'),
            Fields::integer($payload, 's3RawObjectCount'),
        );
    }
}
