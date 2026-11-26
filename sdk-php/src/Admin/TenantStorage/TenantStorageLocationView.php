<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TenantStorage;

use HaakCo\Custd\Fields;

final readonly class TenantStorageLocationView
{
    public function __construct(
        public string $bucket,
        public string $code,
        public int $companyId,
        public string $endpoint,
        public int $id,
        public string $isolationTier,
        public string $provider,
        public string $region,
        public string $rootPrefix,
        public string $uuid,
        public string $validationStatus,
        public bool $writeEnabled,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'bucket'),
            Fields::string($payload, 'code'),
            Fields::integer($payload, 'companyId'),
            Fields::string($payload, 'endpoint'),
            Fields::integer($payload, 'id'),
            Fields::string($payload, 'isolationTier'),
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'region'),
            Fields::string($payload, 'rootPrefix'),
            Fields::string($payload, 'uuid'),
            Fields::string($payload, 'validationStatus'),
            Fields::boolean($payload, 'writeEnabled'),
        );
    }
}
