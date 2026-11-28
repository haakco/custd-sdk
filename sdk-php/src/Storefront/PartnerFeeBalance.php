<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerFeeBalance
{
    /**
     * @param  list<PartnerFeeBalanceCurrency>  $currencies
     */
    public function __construct(
        public string $sellerCompanyUuid,
        public string $partnerCompanyUuid,
        public string $asOf,
        public array $currencies,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            Fields::string($payload, 'asOf'),
            array_map(PartnerFeeBalanceCurrency::fromPayload(...), Fields::optionalObjects($payload, 'currencies') ?? []),
        );
    }
}
