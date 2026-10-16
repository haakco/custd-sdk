<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserPresetList is the named result of GET /api/v1/parsers/presets.
 */
final readonly class ParserPresetList
{
    /** @param list<ParserPreset> $presets */
    public function __construct(
        public array $presets = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $presets = [];
        foreach (Fields::objects($payload, "presets") as $preset) {
            $presets[] = ParserPreset::fromPayload($preset);
        }

        return new self($presets);
    }
}
