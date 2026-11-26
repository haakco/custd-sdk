<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class ProjectionLossResponse
{
    public function __construct(
        public int $deletedRows,
        public string $lostAt,
        public string $runUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'deletedRows'),
            Fields::string($payload, 'lostAt'),
            Fields::string($payload, 'runUuid'),
        );
    }
}
