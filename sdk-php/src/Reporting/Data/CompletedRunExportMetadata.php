<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportMetadata
{
    public function __construct(
        public bool $corrected,
        public string $generatedAt,
        public string $reportVersion,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'corrected' => $this->corrected,
            'generatedAt' => $this->generatedAt,
            'reportVersion' => $this->reportVersion,
        ];

        return $body;
    }
}
