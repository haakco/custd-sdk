<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class Quote
{
    /**
     * @param list<QuoteLine> $lines
     */
    public function __construct(
        public string $quoteUuid,
        public string $cartUuid,
        public int $cartRevision,
        public string $issuedAt,
        public string $expiresAt,
        public array $lines,
        public Totals $totals,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'quoteUuid'),
            Fields::string($payload, 'cartUuid'),
            Fields::integer($payload, 'cartRevision'),
            Fields::string($payload, 'issuedAt'),
            Fields::string($payload, 'expiresAt'),
            array_map(QuoteLine::fromPayload(...), Fields::objects($payload, 'lines')),
            Totals::fromPayload(Fields::object($payload, 'totals')),
        );
    }
}
