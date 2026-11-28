<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class ConfigureMerchant
{
    public function __construct(
        public string $merchantId,
        public int $expectedRevision,
        public string $businessTimeZone,
        public bool $refundsEnabled,
        public string $checkoutSecretKey,
        public string $paymentsReadToken,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'merchantId' => $this->merchantId,
            'expectedRevision' => $this->expectedRevision,
            'businessTimeZone' => $this->businessTimeZone,
            'refundsEnabled' => $this->refundsEnabled,
            'checkoutSecretKey' => $this->checkoutSecretKey,
            'paymentsReadToken' => $this->paymentsReadToken,
        ];

        return $payload;
    }
}
