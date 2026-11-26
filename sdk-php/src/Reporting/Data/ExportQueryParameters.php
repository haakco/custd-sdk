<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

final readonly class ExportQueryParameters
{
    /**
     * @param list<RequestedFilter>|null $filters
     * @param list<string>|null $selections
     * @param ReportingComparisonPreset::*|null $comparison
     */
    public function __construct(
        public ?string $comparison = null,
        public ?array $filters = null,
        public ?string $from = null,
        public ?int $maxRows = null,
        public ?int $rangeDays = null,
        public ?array $selections = null,
        public ?string $to = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->comparison !== null) {
            $body['comparison'] = $this->comparison;
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
        if ($this->selections !== null) {
            $body['selections'] = $this->selections;
        }
        if ($this->to !== null) {
            $body['to'] = $this->to;
        }

        return $body;
    }
}
