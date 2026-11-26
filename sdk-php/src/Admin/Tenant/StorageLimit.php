<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

use HaakCo\Custd\Fields;

final readonly class StorageLimit
{
    public function __construct(
        public bool $hardLimitEnabled,
        public int $includedStorageBytes,
        public int $purchasedStorageBytes,
        public int $warnPercent,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'hardLimitEnabled'),
            Fields::integer($payload, 'includedStorageBytes'),
            Fields::integer($payload, 'purchasedStorageBytes'),
            Fields::integer($payload, 'warnPercent'),
        );
    }
}
