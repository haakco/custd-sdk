<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\RenderedMetricValue;
use HaakCo\Custd\Admin\ReportingPack\RenderedWidgetBucket;
use HaakCo\Custd\Fields;

/**
 * RenderedWidgetData is one rendered reporting query: its value, its dated buckets, how long it took and how fresh
 * its data is, the comparison against the previous period when one was asked for, and the sources, trust,
 * metadata and visual result the server reports beside it.
 */
final readonly class RenderedWidgetData
{
    /**
     * @param list<RenderedWidgetBucket> $buckets
     * @param list<SnapshotLabelMetadata> $labelMetadata
     * @param list<ReportingSourceSummary> $sources
     * @param list<string> $warnings
     */
    public function __construct(
        public array $buckets,
        public int $eventLagP95Ms,
        public int $queryDurationMs,
        public int $snapshotAgeMs,
        public RenderedMetricValue $value,
        public ?RenderedMetricValue $delta = null,
        public ?string $deltaLabel = null,
        public ?float $deltaPercent = null,
        public ?EmailDeliveryRecipients $emailDelivery = null,
        public array $labelMetadata = [],
        public ?ReportingQueryMetadata $metadata = null,
        public ?int $parquetUriCount = null,
        public ?string $secondaryLabel = null,
        public array $sources = [],
        public ?ReportingTrust $trust = null,
        public ?RenderedVisualResult $visual = null,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $delta = Fields::optionalObject($payload, 'delta');
        $emailDelivery = Fields::optionalObject($payload, 'emailDelivery');
        $metadata = Fields::optionalObject($payload, 'metadata');
        $trust = Fields::optionalObject($payload, 'trust');
        $visual = Fields::optionalObject($payload, 'visual');

        return new self(
            array_map(RenderedWidgetBucket::fromPayload(...), Fields::optionalObjects($payload, 'buckets') ?? []),
            Fields::integer($payload, 'eventLagP95Ms'),
            Fields::integer($payload, 'queryDurationMs'),
            Fields::integer($payload, 'snapshotAgeMs'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
            $delta === null ? null : RenderedMetricValue::fromPayload($delta),
            Fields::optionalString($payload, 'deltaLabel'),
            Fields::optionalNumber($payload, 'deltaPercent'),
            $emailDelivery === null ? null : EmailDeliveryRecipients::fromPayload($emailDelivery),
            array_map(SnapshotLabelMetadata::fromPayload(...), Fields::optionalObjects($payload, 'labelMetadata') ?? []),
            $metadata === null ? null : ReportingQueryMetadata::fromPayload($metadata),
            Fields::optionalInteger($payload, 'parquetUriCount'),
            Fields::optionalString($payload, 'secondaryLabel'),
            array_map(ReportingSourceSummary::fromPayload(...), Fields::optionalObjects($payload, 'sources') ?? []),
            $trust === null ? null : ReportingTrust::fromPayload($trust),
            $visual === null ? null : RenderedVisualResult::fromPayload($visual),
            Fields::optionalStrings($payload, 'warnings') ?? [],
        );
    }
}
