<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class MerchantAccount
{
    public function __construct(
        public string $accountUuid,
        public string $sellerCompanyUuid,
        public string $merchantId,
        public string $mode,
        public int $revision,
        public string $status,
        public bool $refundsEnabled,
        public string $businessTimeZone,
        public string $updatedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'accountUuid'),
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'merchantId'),
            Fields::string($payload, 'mode'),
            Fields::integer($payload, 'revision'),
            Fields::string($payload, 'status'),
            Fields::boolean($payload, 'refundsEnabled'),
            Fields::string($payload, 'businessTimeZone'),
            Fields::string($payload, 'updatedAt'),
        );
    }
}
