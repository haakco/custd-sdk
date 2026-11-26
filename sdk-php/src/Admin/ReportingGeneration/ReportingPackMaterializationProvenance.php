<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackMaterializationProvenance
{
    public function __construct(
        public string $definitionFingerprint,
        public int $sourceCoverageCount,
        public string $status,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionFingerprint'),
            Fields::integer($payload, 'sourceCoverageCount'),
            Fields::string($payload, 'status'),
        );
    }
}
