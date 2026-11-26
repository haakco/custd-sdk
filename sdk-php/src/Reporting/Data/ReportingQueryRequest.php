<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class ReportingQueryRequest
{
    /**
     * @param list<string> $metrics
     * @param list<string>|null $dimensions
     * @param list<RequestedFilter>|null $filters
     */
    public function __construct(
        public array $metrics,
        public string $template,
        public ?string $comparison = null,
        public ?bool $countOnly = null,
        public ?string $dashboardKey = null,
        public ?array $dimensions = null,
        public ?array $filters = null,
        public ?string $from = null,
        public ?int $maxRows = null,
        public ?int $rangeDays = null,
        public ?string $to = null,
        public ?string $widgetKey = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'metrics' => $this->metrics,
            'template' => $this->template,
        ];
        if ($this->comparison !== null) {
            $body['comparison'] = $this->comparison;
        }
        if ($this->countOnly !== null) {
            $body['countOnly'] = $this->countOnly;
        }
        if ($this->dashboardKey !== null) {
            $body['dashboardKey'] = $this->dashboardKey;
        }
        if ($this->dimensions !== null) {
            $body['dimensions'] = $this->dimensions;
        }
        if ($this->filters !== null) {
            $body['filters'] = array_map(static fn (RequestedFilter $item): array => $item->serialise(), $this->filters);
        }
        if ($this->from !== null) {
            $body['from'] = $this->from;
        }
        if ($this->maxRows !== null) {
            $body['maxRows'] = $this->maxRows;
        }
        if ($this->rangeDays !== null) {
            $body['rangeDays'] = $this->rangeDays;
        }
        if ($this->to !== null) {
            $body['to'] = $this->to;
        }
        if ($this->widgetKey !== null) {
            $body['widgetKey'] = $this->widgetKey;
        }

        return $body;
    }
}
