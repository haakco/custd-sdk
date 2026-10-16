<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/** ReportingPackSetupTemplateBindRequest carries the client-selected typed bindings. */
final readonly class ReportingPackSetupTemplateBindRequest
{
    public function __construct(
        public LogObservabilityBindings $bindings,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['bindings' => $this->bindings->serialise()];
    }
}
