<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SemanticSeries is one canonical semantic series and its source series. */
final readonly class SemanticSeries
{
    /**
     * @param list<string>|null $assetKeys
     * @param list<string> $allowedSourceUnits
     * @param list<SourceSeries> $sources
     */
    public function __construct(
        public string $key,
        public string $measurementKind,
        public string $canonicalUnit,
        public array $allowedSourceUnits,
        public int $expectedCadenceSeconds,
        public int $maximumGapSeconds,
        public array $sources,
        public ?string $assetKey = null,
        public ?array $assetKeys = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'measurementKind'),
            Fields::string($payload, 'canonicalUnit'),
            Fields::strings($payload, 'allowedSourceUnits'),
            Fields::integer($payload, 'expectedCadenceSeconds'),
            Fields::integer($payload, 'maximumGapSeconds'),
            array_map(static fn (\stdClass $item): SourceSeries => SourceSeries::fromPayload($item), Fields::objects($payload, 'sources')),
            Fields::optionalString($payload, 'assetKey'),
            Fields::optionalStrings($payload, 'assetKeys'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'measurementKind' => $this->measurementKind,
            'canonicalUnit' => $this->canonicalUnit,
            'allowedSourceUnits' => $this->allowedSourceUnits,
            'expectedCadenceSeconds' => $this->expectedCadenceSeconds,
            'maximumGapSeconds' => $this->maximumGapSeconds,
            'sources' => array_map(static fn (SourceSeries $item): array => $item->serialise(), $this->sources),
        ];
        if ($this->assetKey !== null) {
            $payload['assetKey'] = $this->assetKey;
        }
        if ($this->assetKeys !== null) {
            $payload['assetKeys'] = $this->assetKeys;
        }

        return $payload;
    }
}
