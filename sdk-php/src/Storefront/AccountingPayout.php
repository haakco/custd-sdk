<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingPayout
{
    /**
     * @param  list<AccountingEarningAllocation>  $allocations
     */
    public function __construct(
        public string $partnerCompanyUuid,
        public Money $amount,
        public string $externalReference,
        public string $paidAt,
        public string $preferenceUuid,
        public string $taxDisclosureUuid,
        public array $allocations,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'partnerCompanyUuid'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'externalReference'),
            Fields::string($payload, 'paidAt'),
            Fields::string($payload, 'preferenceUuid'),
            Fields::string($payload, 'taxDisclosureUuid'),
            array_map(AccountingEarningAllocation::fromPayload(...), Fields::optionalObjects($payload, 'allocations') ?? []),
        );
    }
}
