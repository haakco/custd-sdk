<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class OperationalStageSummary
{
    /**
     * @param OperationalHealthStatus::* $status
     */
    public function __construct(
        public string $status,
        public ?string $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'reason'),
        );
    }
}
