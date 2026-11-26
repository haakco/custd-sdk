<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\RenderedWidgetData;

/**
 * ReportingPackPreviewResponse is the result of POST /reporting-packs/preview: the rendered widget
 * under `data`, aggregate-only with no raw rows, plus the executive view and presentation preset
 * when the previewed dashboard declares them.
 */
final readonly class ReportingPackPreviewResponse
{
    public function __construct(
        public RenderedWidgetData $data,
        public ?ExecutiveReport $executive = null,
        public ?PresentationPresetSelection $presentation = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'reporting pack preview response');
        $executive = Fields::optionalObject($object, 'executive');
        $presentation = Fields::optionalObject($object, 'presentation');

        return new self(
            RenderedWidgetData::fromPayload(Fields::object($object, 'data')),
            $executive === null ? null : ExecutiveReport::fromPayload($executive),
            $presentation === null ? null : PresentationPresetSelection::fromPayload($presentation),
        );
    }
}
