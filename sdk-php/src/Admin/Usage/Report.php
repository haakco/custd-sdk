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

    /**
     * fromPayload decodes the shape-preserving response body: JSON objects are
     * stdClass and JSON arrays are arrays, so a required collection cannot be
     * satisfied by an object.
     */
    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'usage response');
        $rows = [];
        foreach (Fields::objects($object, 'rows') as $row) {
            $rows[] = Row::fromPayload($row);
        }
        $totals = [];
        foreach (Fields::objects($object, 'totals') as $total) {
            $totals[] = Total::fromPayload($total);
        }

        return new self(
            Fields::string($object, 'schemaVersion'),
            Fields::optionalString($object, 'companySlug') ?? '',
            Fields::string($object, 'start'),
            Fields::string($object, 'end'),
            $rows,
            $totals,
            Fields::integer($object, 'sourceWatermark'),
            Fields::boolean($object, 'containsProvisional'),
            Fields::boolean($object, 'containsIncomplete'),
        );
    }
}
