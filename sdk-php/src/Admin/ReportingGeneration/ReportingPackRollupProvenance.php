<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackRollupProvenance
{
    /**
     * @param list<ReportingPackMaterializationProvenance> $materializations
     */
    public function __construct(
        public string $definitionFingerprint,
        public int $generationId,
        public array $materializations,
        public string $tenantSlug,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionFingerprint'),
            Fields::integer($payload, 'generationId'),
            array_map(ReportingPackMaterializationProvenance::fromPayload(...), Fields::objects($payload, 'materializations')),
            Fields::string($payload, 'tenantSlug'),
        );
    }
}
