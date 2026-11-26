<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class RunRepairResponse
{
    public function __construct(
        public string $repairedAt,
        public RunView $run,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'repairedAt'),
            RunView::fromPayload(Fields::object($payload, 'run')),
        );
    }
}
