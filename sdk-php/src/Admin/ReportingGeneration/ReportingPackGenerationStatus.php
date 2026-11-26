<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackGenerationStatus
{
    /**
     * @param list<ReportingPackGenerationAcknowledgementStatus> $acknowledgements
     */
    public function __construct(
        public array $acknowledgements,
        public ReportingPackGenerationStatusGeneration $generation,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ReportingPackGenerationAcknowledgementStatus::fromPayload(...), Fields::objects($payload, 'acknowledgements')),
            ReportingPackGenerationStatusGeneration::fromPayload(Fields::object($payload, 'generation')),
        );
    }
}
