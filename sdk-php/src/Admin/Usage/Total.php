<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Usage;

use HaakCo\Custd\Fields;

/** Total is a meter total across every row returned for the window. */
final readonly class Total
{
    public function __construct(
        public string $accountCompanySlug = '',
        public string $dataSpaceCompanySlug = '',
        public string $meterSlug = '',
        public string $unit = '',
        public int $quantity = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Fields::string($payload, 'accountCompanySlug'),
            Fields::string($payload, 'dataSpaceCompanySlug'),
            Fields::string($payload, 'meterSlug'),
            Fields::string($payload, 'unit'),
            Fields::integer($payload, 'quantity'),
        );
    }
}
