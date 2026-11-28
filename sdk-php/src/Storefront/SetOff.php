<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class SetOff
{
    public function __construct(
        public string $setOffUuid,
        public string $invoiceUuid,
        public Money $amount,
        public string $appliedAt,
        public string $appliedOn,
        public string $preferenceUuid,
        public string $taxDisclosureUuid,
        public ?SetOffReversal $reversal = null,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        $reversal = Fields::optionalObject($payload, 'reversal');

        return new self(
            Fields::string($payload, 'setOffUuid'),
            Fields::string($payload, 'invoiceUuid'),
            Money::fromPayload(Fields::object($payload, 'amount')),
            Fields::string($payload, 'appliedAt'),
            Fields::string($payload, 'appliedOn'),
            Fields::string($payload, 'preferenceUuid'),
            Fields::string($payload, 'taxDisclosureUuid'),
            $reversal === null ? null : SetOffReversal::fromPayload($reversal),
        );
    }
}
