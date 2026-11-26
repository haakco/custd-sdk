<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class RunDetail
{
    /**
     * @param list<BoundInput> $boundInputs
     * @param list<QuantityResult> $quantities
     */
    public function __construct(
        public array $boundInputs,
        public string $createdAt,
        public string $modelUuid,
        public array $quantities,
        public string $runUuid,
        public int $sampleCount,
        public int $seed,
        public string $trigger,
        public int $versionNumber,
        public ?Decision $decision = null,
        public ?Information $information = null,
        public ?QueuedRunFailure $queuedRunFailure = null,
        public ?Sensitivity $sensitivity = null,
        public ?string $sensitivityOutput = null,
        public ?string $sourceForecastRunUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $decision = Fields::optionalObject($payload, 'decision');
        $information = Fields::optionalObject($payload, 'information');
        $queuedRunFailure = Fields::optionalObject($payload, 'queuedRunFailure');
        $sensitivity = Fields::optionalObject($payload, 'sensitivity');

        return new self(
            array_map(BoundInput::fromPayload(...), Fields::objects($payload, 'boundInputs')),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'modelUuid'),
            array_map(QuantityResult::fromPayload(...), Fields::objects($payload, 'quantities')),
            Fields::string($payload, 'runUuid'),
            Fields::integer($payload, 'sampleCount'),
            Fields::integer($payload, 'seed'),
            Fields::string($payload, 'trigger'),
            Fields::integer($payload, 'versionNumber'),
            $decision === null ? null : Decision::fromPayload($decision),
            $information === null ? null : Information::fromPayload($information),
            $queuedRunFailure === null ? null : QueuedRunFailure::fromPayload($queuedRunFailure),
            $sensitivity === null ? null : Sensitivity::fromPayload($sensitivity),
            Fields::optionalString($payload, 'sensitivityOutput'),
            Fields::optionalString($payload, 'sourceForecastRunUuid'),
        );
    }
}
