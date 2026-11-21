<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** A cached AI explanation and next step for an active finding. */
final readonly class SiteFindingSuggestion
{
    public function __construct(
        public string $explanation,
        public string $nextStep,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'explanation'),
            Fields::string($payload, 'nextStep'),
        );
    }
}
