<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackGenerationValidityListResponse
{
    /**
     * @param list<ReportingPackGenerationValidity> $generations
     */
    public function __construct(
        public array $generations,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(ReportingPackGenerationValidity::fromPayload(...), Fields::objects($payload, 'generations')),
        );
    }
}
