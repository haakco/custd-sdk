<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class ReportExportCreateRequest
{
    /**
     * @param list<string> $formats
     */
    public function __construct(
        public string $dashboardKey,
        public array $formats,
        public ExportQueryParameters $parameters,
        public ?string $idempotencyKey = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'dashboardKey' => $this->dashboardKey,
            'formats' => $this->formats,
            'parameters' => $this->parameters->serialise(),
        ];
        if ($this->idempotencyKey !== null) {
            $body['idempotencyKey'] = $this->idempotencyKey;
        }

        return $body;
    }
}
