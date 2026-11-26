<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class RunList
{
    /**
     * @param list<RunSummary> $runs
     */
    public function __construct(
        public array $runs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(RunSummary::fromPayload(...), Fields::objects($payload, 'runs')),
        );
    }
}
