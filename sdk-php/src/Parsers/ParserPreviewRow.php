<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserPreviewRow is one sample line's preview result. `line` is 1-based in the
 * original sample; `framing` is the source-framing outcome and is populated only
 * for a non-none framing mode; `error` is set only when `ok` is false.
 */
final readonly class ParserPreviewRow
{
    /** The visible per-record framing outcomes. */
    public const FRAMING_OUTCOMES = ["complete", "malformed", "incomplete", "oversize"];

    /**
     * @param array<string, mixed>|null $context
     * @param array<string, mixed>|null $payload
     */
    public function __construct(
        public int $line = 0,
        public bool $ok = false,
        public ?string $framing = null,
        public ?string $eventTypeSlug = null,
        public ?string $timestamp = null,
        public ?array $context = null,
        public ?array $payload = null,
        public ?string $error = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $context = Fields::optionalObject($payload, "context");
        $rowPayload = Fields::optionalObject($payload, "payload");

        return new self(
            Fields::integer($payload, "line"),
            Fields::boolean($payload, "ok"),
            Fields::optionalString($payload, "framing"),
            Fields::optionalString($payload, "eventTypeSlug"),
            Fields::optionalString($payload, "timestamp"),
            $context === null ? null : get_object_vars($context),
            $rowPayload === null ? null : get_object_vars($rowPayload),
            Fields::optionalString($payload, "error"),
        );
    }
}
