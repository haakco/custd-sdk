<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class OperationalSummary
{
    public function __construct(
        public OperationalBacklogSummary $backlog,
        public OperationalStageSummary $durable,
        public OperationalStageSummary $queryable,
        public OperationalStageSummary $received,
        public string $status,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            OperationalBacklogSummary::fromPayload(Fields::object($payload, 'backlog')),
            OperationalStageSummary::fromPayload(Fields::object($payload, 'durable')),
            OperationalStageSummary::fromPayload(Fields::object($payload, 'queryable')),
            OperationalStageSummary::fromPayload(Fields::object($payload, 'received')),
            Fields::string($payload, 'status'),
        );
    }
}
