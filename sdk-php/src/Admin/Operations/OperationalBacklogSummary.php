<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class OperationalBacklogSummary
{
    public function __construct(
        public string $classification,
        public int $depth,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'classification'),
            Fields::integer($payload, 'depth'),
        );
    }
}
