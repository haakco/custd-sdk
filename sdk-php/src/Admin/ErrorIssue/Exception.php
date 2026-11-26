<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class Exception
{
    /**
     * @param list<Frame> $frames
     */
    public function __construct(
        public string $type,
        public array $frames = [],
        public ?int $framesOmitted = null,
        public ?bool $handled = null,
        public ?string $module = null,
        public ?string $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'type'),
            array_map(Frame::fromPayload(...), Fields::optionalObjects($payload, 'frames') ?? []),
            Fields::optionalInteger($payload, 'framesOmitted'),
            Fields::optionalBoolean($payload, 'handled'),
            Fields::optionalString($payload, 'module'),
            Fields::optionalString($payload, 'value'),
        );
    }
}
