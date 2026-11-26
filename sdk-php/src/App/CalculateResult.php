<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Uncertainty\QuantityResult;
use HaakCo\Custd\Fields;

final readonly class CalculateResult
{
    /**
     * @param list<QuantityResult> $quantities
     */
    public function __construct(
        public string $modelUuid,
        public array $quantities,
        public int $sampleCount,
        public int $seed,
        public int $versionNumber,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'modelUuid'),
            array_map(QuantityResult::fromPayload(...), Fields::objects($payload, 'quantities')),
            Fields::integer($payload, 'sampleCount'),
            Fields::integer($payload, 'seed'),
            Fields::integer($payload, 'versionNumber'),
        );
    }
}
