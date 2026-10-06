<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Usage;

use HaakCo\Custd\Fields;

/**
 * Report is the attributed usage for the token's own tenant.
 *
 * `containsProvisional` and `containsIncomplete` are the server's own
 * assessment of the returned rows, so a caller deciding whether a number is
 * settled reads them rather than assuming every row is final.
 */
final readonly class Report
{
    /**
     * @param list<Row> $rows
     * @param list<Total> $totals
     */
    public function __construct(
        public string $schemaVersion = '',
        public string $companySlug = '',
        public string $start = '',
        public string $end = '',
        public array $rows = [],
        public array $totals = [],
        public int $sourceWatermark = 0,
        public bool $containsProvisional = false,
        public bool $containsIncomplete = false,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        $rows = [];
        foreach (Fields::objects($payload, 'rows') as $row) {
            $rows[] = Row::fromPayload($row);
        }
        $totals = [];
        foreach (Fields::objects($payload, 'totals') as $total) {
            $totals[] = Total::fromPayload($total);
        }

        return new self(
            Fields::string($payload, 'schemaVersion'),
            Fields::optionalString($payload, 'companySlug') ?? '',
            Fields::string($payload, 'start'),
            Fields::string($payload, 'end'),
            $rows,
            $totals,
            Fields::integer($payload, 'sourceWatermark'),
            Fields::boolean($payload, 'containsProvisional'),
            Fields::boolean($payload, 'containsIncomplete'),
        );
    }
}
