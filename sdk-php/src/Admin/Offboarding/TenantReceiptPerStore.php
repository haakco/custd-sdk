<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

use HaakCo\Custd\Fields;

final readonly class TenantReceiptPerStore
{
    public function __construct(
        public int $deletedCount,
        public int $retainedExceptionsCount,
        public string $retentionClass,
        public string $store,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'deleted_count'),
            Fields::integer($payload, 'retained_exceptions_count'),
            Fields::string($payload, 'retention_class'),
            Fields::string($payload, 'store'),
        );
    }
}
