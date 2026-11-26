<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportIdentity
{
    public function __construct(
        public int $packGeneration,
        public string $packKey,
        public string $planId,
        public string $runId,
        public string $tenantId,
        public string $versionId,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'packGeneration' => $this->packGeneration,
            'packKey' => $this->packKey,
            'planId' => $this->planId,
            'runId' => $this->runId,
            'tenantId' => $this->tenantId,
            'versionId' => $this->versionId,
        ];

        return $body;
    }
}
