<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class CompletedRunExportRequest
{
    /**
     * @param list<ReportingExportFormat::*> $formats
     */
    public function __construct(
        public array $formats,
        public CompletedRunExportSource $source,
        public ?string $idempotencyKey = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'formats' => $this->formats,
            'source' => $this->source->serialise(),
        ];
        if ($this->idempotencyKey !== null) {
            $body['idempotencyKey'] = $this->idempotencyKey;
        }

        return $body;
    }
}
