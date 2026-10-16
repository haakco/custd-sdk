<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ObservationContract declares the semantic observation sources and series. */
final readonly class ObservationContract
{
    /**
     * @param list<ObservationSource> $sources
     * @param list<ObservationAsset> $assets
     * @param list<SemanticSeries> $series
     */
    public function __construct(
        public int $version,
        public array $sources,
        public array $assets,
        public array $series,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'version'),
            array_map(static fn (\stdClass $item): ObservationSource => ObservationSource::fromPayload($item), Fields::objects($payload, 'sources')),
            array_map(static fn (\stdClass $item): ObservationAsset => ObservationAsset::fromPayload($item), Fields::objects($payload, 'assets')),
            array_map(static fn (\stdClass $item): SemanticSeries => SemanticSeries::fromPayload($item), Fields::objects($payload, 'series')),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'version' => $this->version,
            'sources' => array_map(static fn (ObservationSource $item): array => $item->serialise(), $this->sources),
            'assets' => array_map(static fn (ObservationAsset $item): array => $item->serialise(), $this->assets),
            'series' => array_map(static fn (SemanticSeries $item): array => $item->serialise(), $this->series),
        ];
    }
}
