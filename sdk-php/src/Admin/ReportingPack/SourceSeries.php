<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SourceSeries places one source series at a priority. */
final readonly class SourceSeries
{
    public function __construct(
        public string $sourceKey,
        public string $sourceSeriesKey,
        public int $priority,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sourceKey'),
            Fields::string($payload, 'sourceSeriesKey'),
            Fields::integer($payload, 'priority'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'sourceKey' => $this->sourceKey,
            'sourceSeriesKey' => $this->sourceSeriesKey,
            'priority' => $this->priority,
        ];
    }
}
