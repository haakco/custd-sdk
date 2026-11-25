<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/**
 * ReportingPackPreviewResponse is the result of POST /reporting-packs/preview: the rendered value
 * and buckets the route returns under `data`.
 */
final readonly class ReportingPackPreviewResponse
{
    /** @param list<RenderedWidgetBucket>|null $buckets */
    public function __construct(
        public RenderedMetricValue $value,
        public ?array $buckets = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::object(Fields::jsonObject($payload, 'reporting pack preview response'), 'data');
        $buckets = Fields::optionalObjects($object, 'buckets');

        return new self(
            RenderedMetricValue::fromPayload(Fields::object($object, 'value')),
            $buckets === null
                ? null
                : array_map(static fn (\stdClass $item): RenderedWidgetBucket => RenderedWidgetBucket::fromPayload($item), $buckets),
        );
    }
}
