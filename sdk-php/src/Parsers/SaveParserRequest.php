<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

/**
 * SaveParserRequest is the validated create/update body for a tenant-owned
 * parser.
 *
 * `enabled` is optional: leaving it null omits the field so the server keeps its
 * default (an enabled parser), which also keeps the body valid against a server
 * that does not yet accept the field. `framing` is the same stateless framing
 * configuration a preview carries, so save and preview agree by construction.
 */
final readonly class SaveParserRequest
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
        public array $fieldMapping = [],
        public ?ParserFraming $framing = null,
        public ?bool $enabled = null,
    ) {
        if ($this->code === "" || $this->name === "" || $this->parserType === "") {
            throw new \InvalidArgumentException("custd: parser requires code, name and parserType");
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = [
            "code" => $this->code,
            "name" => $this->name,
            "parserType" => $this->parserType,
            "pattern" => $this->pattern,
            "timestampFormat" => $this->timestampFormat,
            "fieldMapping" => $this->fieldMapping,
        ];
        if ($this->framing !== null) {
            $payload["framing"] = $this->framing->serialise();
        }
        if ($this->enabled !== null) {
            $payload["enabled"] = $this->enabled;
        }

        return $payload;
    }
}
