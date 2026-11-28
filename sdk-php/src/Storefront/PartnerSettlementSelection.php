<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class PartnerSettlementSelection
{
    public function __construct(
        public string $sellerCompanyUuid,
        public string $partnerCompanyUuid,
        public ?PartnerSettlementPreference $current = null,
        public ?PartnerSettlementPreference $next = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $current = Fields::optionalObject($payload, 'current');
        $next = Fields::optionalObject($payload, 'next');

        return new self(
            Fields::string($payload, 'sellerCompanyUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            $current === null ? null : PartnerSettlementPreference::fromPayload($current),
            $next === null ? null : PartnerSettlementPreference::fromPayload($next),
        );
    }
}
