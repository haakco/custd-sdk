<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserDefinition is a tenant-owned parser returned by the parser routes.
 *
 * `framing`, `enabled`, and `revision` are newer server fields. Each is optional
 * so a response from a server that predates them still decodes; when present it
 * carries the server's value. `revision` is the identity that pins the framing
 * for a saved parser.
 */
final readonly class ParserDefinition
{
    /**
     * @param array<string, string> $fieldMapping
     * @param array<string, array{fields: list<string>, namespace: string}> $generatedFields
     */
    public function __construct(
        public string $uuid = "",
        public string $code = "",
        public string $name = "",
        public string $parserType = "",
        public ?string $pattern = null,
        public string $timestampFormat = "",
        public array $fieldMapping = [],
        public array $generatedFields = [],
        public ?ParserFraming $framing = null,
        public ?bool $enabled = null,
        public ?int $revision = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $framing = Fields::optionalObject($payload, "framing");

        return new self(
            Fields::string($payload, "uuid"),
            Fields::string($payload, "code"),
            Fields::string($payload, "name"),
            Fields::string($payload, "parserType"),
            Fields::optionalString($payload, "pattern"),
            Fields::string($payload, "timestampFormat"),
            Fields::stringMap($payload, "fieldMapping"),
            self::generatedFields($payload),
            $framing === null ? null : ParserFraming::fromPayload($framing),
            Fields::optionalBoolean($payload, "enabled"),
            Fields::optionalInteger($payload, "revision"),
        );
    }

    /**
     * generatedFields decodes the optional generated-field map. The field is
     * emitted as `null` when the parser has none, so a null or absent field
     * decodes to an empty map.
     *
     * @return array<string, array{fields: list<string>, namespace: string}>
     */
    private static function generatedFields(\stdClass $payload): array
    {
        $raw = Fields::optionalObject($payload, "generatedFields");
        if ($raw === null) {
            return [];
        }
        $fields = [];
        foreach (get_object_vars($raw) as $key => $config) {
            if (!$config instanceof \stdClass) {
                throw new \UnexpectedValueException("custd: parser generatedFields.{$key} must be an object");
            }
            $fields[$key] = [
                "fields" => Fields::optionalStrings($config, "fields") ?? [],
                "namespace" => Fields::optionalString($config, "namespace") ?? "",
            ];
        }

        return $fields;
    }
}
