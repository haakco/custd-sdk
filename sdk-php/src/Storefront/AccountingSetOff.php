<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingSetOff
{
    /**
     * @param  list<AccountingEarningAllocation>  $allocations
     */
    public function __construct(
        public string $setOffUuid,
        public string $partnerCompanyUuid,
        public Money $amount,
        public string $occurredAt,
        public string $preferenceUuid,
        public string $taxDisclosureUuid,
        public array $allocations,
        public ?string $creditNoteUuid = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'setOffUuid'),
            Fields::string($payload, 'partnerCompanyUuid'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'occurredAt'),
            Fields::string($payload, 'preferenceUuid'),
            Fields::string($payload, 'taxDisclosureUuid'),
            array_map(AccountingEarningAllocation::fromPayload(...), Fields::optionalObjects($payload, 'allocations') ?? []),
            Fields::optionalString($payload, 'creditNoteUuid'),
        );
    }
}
