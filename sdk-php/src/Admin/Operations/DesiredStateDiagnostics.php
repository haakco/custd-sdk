<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class DesiredStateDiagnostics
{
    public function __construct(
        public ?int $backlog = null,
        public ?int $exhaustedTotal = null,
        public ?int $oldestPendingAgeSeconds = null,
        public ?int $terminalTotal = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'backlog'),
            Fields::optionalInteger($payload, 'exhaustedTotal'),
            Fields::optionalInteger($payload, 'oldestPendingAgeSeconds'),
            Fields::optionalInteger($payload, 'terminalTotal'),
        );
    }
}
