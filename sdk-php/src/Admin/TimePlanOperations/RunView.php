<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class RunView
{
    /**
     * @param list<RunBlockView> $blocks
     */
    public function __construct(
        public int $baselineHorizonMs,
        public array $blocks,
        public int $lostMs,
        public int $overrunMs,
        public string $planUuid,
        public string $status,
        public int $streamVersion,
        public int $unusedMs,
        public string $uuid,
        public ?string $currentBlockUuid = null,
        public ?string $effectiveEndsAt = null,
        public ?string $effectiveStartsAt = null,
        public ?int $executableHorizonMs = null,
        public ?string $scheduledEndsAt = null,
        public ?string $scheduledStartsAt = null,
        public ?string $startPolicy = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'baselineHorizonMs'),
            array_map(RunBlockView::fromPayload(...), Fields::objects($payload, 'blocks')),
            Fields::integer($payload, 'lostMs'),
            Fields::integer($payload, 'overrunMs'),
            Fields::string($payload, 'planUuid'),
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'streamVersion'),
            Fields::integer($payload, 'unusedMs'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'currentBlockUuid'),
            Fields::optionalString($payload, 'effectiveEndsAt'),
            Fields::optionalString($payload, 'effectiveStartsAt'),
            Fields::optionalInteger($payload, 'executableHorizonMs'),
            Fields::optionalString($payload, 'scheduledEndsAt'),
            Fields::optionalString($payload, 'scheduledStartsAt'),
            Fields::optionalString($payload, 'startPolicy'),
        );
    }
}
