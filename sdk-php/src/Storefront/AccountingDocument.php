<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class AccountingDocument
{
    /**
     * @param  list<QuoteLine>  $lines
     */
    public function __construct(
        public string $number,
        public string $issuedAt,
        public array $lines,
        public Totals $totals,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'number'),
            Fields::string($payload, 'issuedAt'),
            array_map(QuoteLine::fromPayload(...), Fields::optionalObjects($payload, 'lines') ?? []),
            Totals::fromPayload(Fields::object($payload, 'totals')),
        );
    }
}
