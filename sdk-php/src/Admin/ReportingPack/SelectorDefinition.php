<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SelectorDefinition names one selector and its selector type. */
final readonly class SelectorDefinition
{
    public function __construct(
        public string $selector,
        public string $type,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'selector'), Fields::string($payload, 'type'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['selector' => $this->selector, 'type' => $this->type];
    }
}
