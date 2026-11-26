<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class RunSummary
{
    public function __construct(
        public string $createdAt,
        public string $modelUuid,
        public string $runUuid,
        public int $sampleCount,
        public int $seed,
        public string $trigger,
        public int $versionNumber,
        public ?string $sourceForecastRunUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'modelUuid'),
            Fields::string($payload, 'runUuid'),
            Fields::integer($payload, 'sampleCount'),
            Fields::integer($payload, 'seed'),
            Fields::string($payload, 'trigger'),
            Fields::integer($payload, 'versionNumber'),
            Fields::optionalString($payload, 'sourceForecastRunUuid'),
        );
    }
}
