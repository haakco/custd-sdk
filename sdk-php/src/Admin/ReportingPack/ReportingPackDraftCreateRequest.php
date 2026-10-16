<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/** ReportingPackDraftCreateRequest creates one draft from a full definition. */
final readonly class ReportingPackDraftCreateRequest
{
    public function __construct(
        public PackDefinition $definition,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['definition' => $this->definition->serialise()];
    }
}
