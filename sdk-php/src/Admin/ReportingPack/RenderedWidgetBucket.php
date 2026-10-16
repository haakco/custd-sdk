<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RenderedWidgetBucket is one day's rendered preview bucket. */
final readonly class RenderedWidgetBucket
{
    public function __construct(
        public string $date,
        public RenderedMetricValue $value,
        public string $source,
        public int $queryDurationMs,
        public ?int $parquetUriCount = null,
        public ?string $message = null,
        public ?RenderedMetricValue $secondary = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $secondary = Fields::optionalObject($payload, 'secondary');

        return new self(
            Fields::string($payload, 'date'),
            RenderedMetricValue::fromPayload(Fields::object($payload, 'value')),
            Fields::string($payload, 'source'),
            Fields::integer($payload, 'queryDurationMs'),
            Fields::optionalInteger($payload, 'parquetUriCount'),
            Fields::optionalString($payload, 'message'),
            $secondary === null ? null : RenderedMetricValue::fromPayload($secondary),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'date' => $this->date,
            'value' => $this->value->serialise(),
            'source' => $this->source,
            'queryDurationMs' => $this->queryDurationMs,
        ];
        if ($this->parquetUriCount !== null) {
            $payload['parquetUriCount'] = $this->parquetUriCount;
        }
        if ($this->message !== null) {
            $payload['message'] = $this->message;
        }
        if ($this->secondary !== null) {
            $payload['secondary'] = $this->secondary->serialise();
        }

        return $payload;
    }
}
