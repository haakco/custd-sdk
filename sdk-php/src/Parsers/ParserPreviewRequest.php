<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

/**
 * ParserPreviewRequest is the dry-run body for POST /api/v1/parser-preview.
 *
 * The previewed definition carries the same `framing` a save would, so a preview
 * exercises exactly what would be persisted. It deliberately carries no
 * `enabled`: that field belongs only to the save body, and the preview route
 * decodes strictly. The service bounds the sample to 256 KiB and `maxLines` to
 * 100.
 */
final readonly class ParserPreviewRequest
{
    /**
     * @param array<string, string> $fieldMapping
     */
    public function __construct(
        public string $code,
        public string $name,
        public string $parserType,
        public ?string $pattern,
        public string $timestampFormat,
        public array $fieldMapping,
        public string $sample,
        public int $maxLines,
        public ?ParserFraming $framing = null,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $parser = [
            "code" => $this->code,
            "name" => $this->name,
            "parserType" => $this->parserType,
            "pattern" => $this->pattern,
            "timestampFormat" => $this->timestampFormat,
            "fieldMapping" => $this->fieldMapping,
        ];
        if ($this->framing !== null) {
            $parser["framing"] = $this->framing->serialise();
        }

        return [
            "parser" => $parser,
            "sample" => $this->sample,
            "maxLines" => $this->maxLines,
        ];
    }
}
