<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class AcceptBillingPartnerInvitationRequest
{
    public function __construct(
        public string $code,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'code' => $this->code,
        ];

        return $payload;
    }
}
