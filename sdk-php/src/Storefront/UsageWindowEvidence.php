<?php

declare(strict_types=1);

namespace HaakCo\Custd\Storefront;

use HaakCo\Custd\Fields;

final readonly class UsageWindowEvidence
{
    public function __construct(
        public UsagePeriod $period,
        public string $quantity,
        public string $state,
        public string $sourceWatermark,
        public int $correctionGeneration,
        public int $calculationVersion,
    ) {}

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            UsagePeriod::fromPayload(Fields::object($payload, 'period')),
            Fields::string($payload, 'quantity'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'sourceWatermark'),
            Fields::integer($payload, 'correctionGeneration'),
            Fields::integer($payload, 'calculationVersion'),
        );
    }
}
