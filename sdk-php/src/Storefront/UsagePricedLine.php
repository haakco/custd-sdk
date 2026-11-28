<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsagePricedLine
{
    /**
     * @param  list<UsageWindowEvidence>  $windows
     */
    public function __construct(
        public UsageInvoiceScope $scope,
        public UsagePeriod $period,
        public UsageSource $source,
        public UsageTariffRevision $tariff,
        public string $quantity,
        public string $rounding,
        public array $windows,
        public Money $netAmount,
        public Money $taxAmount,
        public Money $grossAmount,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            UsageInvoiceScope::fromPayload(Fields::object($payload, 'scope')),
            UsagePeriod::fromPayload(Fields::object($payload, 'period')),
            UsageSource::fromPayload(Fields::object($payload, 'source')),
            UsageTariffRevision::fromPayload(Fields::object($payload, 'tariff')),
            Fields::string($payload, 'quantity'),
            Fields::string($payload, 'rounding'),
            array_map(UsageWindowEvidence::fromPayload(...), Fields::optionalObjects($payload, 'windows') ?? []),
            Money::fromPayload(Fields::object($payload, 'netAmount')),
            Money::fromPayload(Fields::object($payload, 'taxAmount')),
            Money::fromPayload(Fields::object($payload, 'grossAmount')),
        );
    }
}
