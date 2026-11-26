<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class DashboardGenerationRequest
{
    public function __construct(
        public string $dashboardKey,
        public ExportQueryParameters $parameters,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'dashboardKey' => $this->dashboardKey,
            'parameters' => $this->parameters->serialise(),
        ];

        return $body;
    }
}
