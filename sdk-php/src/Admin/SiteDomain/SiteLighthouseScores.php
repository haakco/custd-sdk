<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteLighthouseScores
{
    public function __construct(
        public ?int $performance = null,
        public ?int $accessibility = null,
        public ?int $bestPractices = null,
        public ?int $seo = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'performance'),
            Fields::optionalInteger($payload, 'accessibility'),
            Fields::optionalInteger($payload, 'bestPractices'),
            Fields::optionalInteger($payload, 'seo'),
        );
    }
}
