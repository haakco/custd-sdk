<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/** ReportingPackDraftUpdateRequest updates a draft with an expected revision. */
final readonly class ReportingPackDraftUpdateRequest
{
    public function __construct(
        public PackDefinition $definition,
        public int $expectedRevision,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['definition' => $this->definition->serialise(), 'expectedRevision' => $this->expectedRevision];
    }
}
