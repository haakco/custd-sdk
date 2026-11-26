<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ErrorIssue;

use HaakCo\Custd\Fields;

final readonly class Frame
{
    /**
     * @param list<string> $postContext
     * @param list<string> $preContext
     */
    public function __construct(
        public ?int $column = null,
        public ?string $contextLine = null,
        public ?string $filename = null,
        public ?string $function = null,
        public ?bool $inApp = null,
        public ?int $line = null,
        public ?string $module = null,
        public array $postContext = [],
        public array $preContext = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'column'),
            Fields::optionalString($payload, 'contextLine'),
            Fields::optionalString($payload, 'filename'),
            Fields::optionalString($payload, 'function'),
            Fields::optionalBoolean($payload, 'inApp'),
            Fields::optionalInteger($payload, 'line'),
            Fields::optionalString($payload, 'module'),
            Fields::optionalStrings($payload, 'postContext') ?? [],
            Fields::optionalStrings($payload, 'preContext') ?? [],
        );
    }
}
