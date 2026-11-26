<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class PresentationPresetSelection
{
    /**
     * @param PresentationNonColorEncoding::* $nonColorEncoding
     * @param PresentationPresetId::* $presetId
     * @param PresentationSummaryTemplate::* $summaryTemplateId
     */
    public function __construct(
        public string $nonColorEncoding,
        public string $presetId,
        public string $summaryTemplateId,
        public int $version,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'nonColorEncoding'),
            Fields::string($payload, 'presetId'),
            Fields::string($payload, 'summaryTemplateId'),
            Fields::integer($payload, 'version'),
        );
    }
}
