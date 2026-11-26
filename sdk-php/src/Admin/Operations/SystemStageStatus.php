<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStageStatus
{
    /**
     * @param OperationalHealthStatus::* $status
     */
    public function __construct(
        public string $name,
        public string $status,
        public ?SystemStageProgress $progress = null,
        public ?string $reason = null,
        public ?SystemStageSignals $signals = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $progress = Fields::optionalObject($payload, 'progress');
        $signals = Fields::optionalObject($payload, 'signals');

        return new self(
            Fields::string($payload, 'name'),
            Fields::string($payload, 'status'),
            $progress === null ? null : SystemStageProgress::fromPayload($progress),
            Fields::optionalString($payload, 'reason'),
            $signals === null ? null : SystemStageSignals::fromPayload($signals),
        );
    }
}
