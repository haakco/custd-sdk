<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SourceReconciliation declares how one series reconciles across sources. */
final readonly class SourceReconciliation
{
    /** @param list<SourceSeries> $sources */
    public function __construct(
        public int $version,
        public string $tenantKey,
        public string $seriesKey,
        public string $mode,
        public int $maxAgeSeconds,
        public array $sources,
        public ?string $canonicalUnit = null,
        public ?float $absoluteTolerance = null,
        public ?float $relativeTolerance = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'tenantKey'),
            Fields::string($payload, 'seriesKey'),
            Fields::string($payload, 'mode'),
            Fields::integer($payload, 'maxAgeSeconds'),
            array_map(static fn (\stdClass $item): SourceSeries => SourceSeries::fromPayload($item), Fields::objects($payload, 'sources')),
            Fields::optionalString($payload, 'canonicalUnit'),
            Fields::optionalNumber($payload, 'absoluteTolerance'),
            Fields::optionalNumber($payload, 'relativeTolerance'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'version' => $this->version,
            'tenantKey' => $this->tenantKey,
            'seriesKey' => $this->seriesKey,
            'mode' => $this->mode,
            'maxAgeSeconds' => $this->maxAgeSeconds,
            'sources' => array_map(static fn (SourceSeries $item): array => $item->serialise(), $this->sources),
        ];
        if ($this->canonicalUnit !== null) {
            $payload['canonicalUnit'] = $this->canonicalUnit;
        }
        if ($this->absoluteTolerance !== null) {
            $payload['absoluteTolerance'] = $this->absoluteTolerance;
        }
        if ($this->relativeTolerance !== null) {
            $payload['relativeTolerance'] = $this->relativeTolerance;
        }

        return $payload;
    }
}
