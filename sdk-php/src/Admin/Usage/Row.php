<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Usage;

use HaakCo\Custd\Fields;

/**
 * Row is one attributed usage quantity for one half-open UTC window.
 *
 * `completenessState` is server-derived and owns the meaning of provisional,
 * final, corrected, and incomplete; the SDK surfaces it unchanged.
 */
final readonly class Row
{
    public function __construct(
        public string $accountCompanySlug = '',
        public string $dataSpaceCompanySlug = '',
        public string $meterSlug = '',
        public int $meterVersion = 0,
        public string $unit = '',
        public string $windowStart = '',
        public string $windowEnd = '',
        public int $quantity = 0,
        public int $sourceWatermark = 0,
        public string $completenessState = '',
        public int $correctionGeneration = 0,
        public int $calculationVersion = 0,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(
            Fields::string($payload, 'accountCompanySlug'),
            Fields::string($payload, 'dataSpaceCompanySlug'),
            Fields::string($payload, 'meterSlug'),
            Fields::integer($payload, 'meterVersion'),
            Fields::string($payload, 'unit'),
            Fields::string($payload, 'windowStart'),
            Fields::string($payload, 'windowEnd'),
            Fields::integer($payload, 'quantity'),
            Fields::integer($payload, 'sourceWatermark'),
            Fields::string($payload, 'completenessState'),
            Fields::integer($payload, 'correctionGeneration'),
            Fields::integer($payload, 'calculationVersion'),
        );
    }
}
