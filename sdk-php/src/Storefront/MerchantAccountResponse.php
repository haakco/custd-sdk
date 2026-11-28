<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class MerchantAccountResponse
{
    public function __construct(
        public ?MerchantAccount $account = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        $account = Fields::optionalObject($payload, 'account');

        return new self(
            $account === null ? null : MerchantAccount::fromPayload($account),
        );
    }
}
