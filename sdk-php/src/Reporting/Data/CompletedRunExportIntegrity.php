<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportIntegrity
{
    public function __construct(
        public string $exportSha256,
        public string $sourceInputSha256,
        public string $sourceReportSha256,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'exportSha256' => $this->exportSha256,
            'sourceInputSha256' => $this->sourceInputSha256,
            'sourceReportSha256' => $this->sourceReportSha256,
        ];

        return $body;
    }
}
