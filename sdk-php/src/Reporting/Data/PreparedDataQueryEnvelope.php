<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\RenderedWidgetData;

final readonly class PreparedDataQueryEnvelope
{
    public function __construct(
        public RenderedWidgetData $data,
        public PreparedDataOutput $output,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            RenderedWidgetData::fromPayload(Fields::object($payload, 'data')),
            PreparedDataOutput::fromPayload(Fields::object($payload, 'output')),
        );
    }
}
