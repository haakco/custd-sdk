<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PublishReferralTerms
{
    public function __construct(
        public string $code,
        public string $effectiveFrom,
        public string $agreementDate,
        public string $agreementReference,
        public bool $signedAgreementAttested,
        public string $share,
        public int $months,
        public int $holdDays,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'code' => $this->code,
            'effectiveFrom' => $this->effectiveFrom,
            'agreementDate' => $this->agreementDate,
            'agreementReference' => $this->agreementReference,
            'signedAgreementAttested' => $this->signedAgreementAttested,
            'share' => $this->share,
            'months' => $this->months,
            'holdDays' => $this->holdDays,
        ];

        return $payload;
    }
}
