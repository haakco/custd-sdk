<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/** QueryHint names the preview query template, metrics and dimensions. */
final readonly class QueryHint
{
    /**
     * @param list<string> $metrics
     * @param list<string>|null $dimensions
     */
    public function __construct(
        public string $template,
        public array $metrics,
        public ?array $dimensions = null,
        public ?int $rangeDays = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['template' => $this->template, 'metrics' => $this->metrics];
        if ($this->dimensions !== null) {
            $payload['dimensions'] = $this->dimensions;
        }
        if ($this->rangeDays !== null) {
            $payload['rangeDays'] = $this->rangeDays;
        }

        return $payload;
    }
}
