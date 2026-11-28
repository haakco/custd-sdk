<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

final readonly class PublishPartnerProductTermsRequest
{
    public function __construct(
        public string $partnerCompanyUuid,
        public string $effectiveFrom,
        public string $agreementDate,
        public string $agreementReference,
        public bool $signedAgreementAttested,
        public string $unitCost,
        public string $sellerCut,
    ) {}

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'partnerCompanyUuid' => $this->partnerCompanyUuid,
            'effectiveFrom' => $this->effectiveFrom,
            'agreementDate' => $this->agreementDate,
            'agreementReference' => $this->agreementReference,
            'signedAgreementAttested' => $this->signedAgreementAttested,
            'unitCost' => $this->unitCost,
            'sellerCut' => $this->sellerCut,
        ];

        return $payload;
    }
}
