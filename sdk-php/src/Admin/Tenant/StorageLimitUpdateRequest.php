<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Tenant;

final readonly class StorageLimitUpdateRequest
{
    public function __construct(
        public bool $hardLimitEnabled,
        public int $includedStorageBytes,
        public int $purchasedStorageBytes,
        public int $warnPercent,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'hardLimitEnabled' => $this->hardLimitEnabled,
            'includedStorageBytes' => $this->includedStorageBytes,
            'purchasedStorageBytes' => $this->purchasedStorageBytes,
            'warnPercent' => $this->warnPercent,
        ];

        return $body;
    }
}
