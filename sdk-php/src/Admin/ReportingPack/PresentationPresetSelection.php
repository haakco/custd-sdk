<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Reporting\Data\PresentationNonColorEncoding;
use HaakCo\Custd\Reporting\Data\PresentationPresetId;
use HaakCo\Custd\Reporting\Data\PresentationSummaryTemplate;

/** PresentationPresetSelection selects one visualization preset. */
final readonly class PresentationPresetSelection
{
    /**
     * @param PresentationNonColorEncoding::* $nonColorEncoding
     * @param PresentationPresetId::* $presetId
     * @param PresentationSummaryTemplate::* $summaryTemplateId
     */
    public function __construct(
        public string $presetId,
        public int $version,
        public string $nonColorEncoding,
        public string $summaryTemplateId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'presetId'),
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'nonColorEncoding'),
            Fields::string($payload, 'summaryTemplateId'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'presetId' => $this->presetId,
            'version' => $this->version,
            'nonColorEncoding' => $this->nonColorEncoding,
            'summaryTemplateId' => $this->summaryTemplateId,
        ];
    }
}
