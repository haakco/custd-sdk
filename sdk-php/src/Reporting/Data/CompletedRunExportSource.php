<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportSource
{
    public function __construct(
        public string $contractVersion,
        public CompletedRunExportIdentity $identity,
        public CompletedRunExportIntegrity $integrity,
        public CompletedRunExportMetadata $metadata,
        public CompletedRunExportRedaction $redaction,
        public CompletedRunExportSections $sections,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'contractVersion' => $this->contractVersion,
            'identity' => $this->identity->serialise(),
            'integrity' => $this->integrity->serialise(),
            'metadata' => $this->metadata->serialise(),
            'redaction' => $this->redaction->serialise(),
            'sections' => $this->sections->serialise(),
        ];

        return $body;
    }
}
