<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserFraming is the stateless framing configuration carried by a parser
 * definition.
 *
 * Framing is revision-pinned with the parser and is the same configuration for
 * preview and save. Multiline assembly is bounded by `maxRecordBytes` and
 * `maxLines`; there is deliberately no idle timeout on stateless batch framing.
 */
final readonly class ParserFraming
{
    /** The framing modes the service can execute. */
    public const TYPES = ["none", "docker-json", "k8s-cri", "php-multiline"];

    /** The per-record cap a caller gets when it requests none. */
    public const DEFAULT_MAX_RECORD_BYTES = 64 << 10;
    /** The per-record line cap a caller gets when it requests none. */
    public const DEFAULT_MAX_LINES = 32;
    /** The hard ceiling on one assembled record. */
    public const MAX_RECORD_BYTES = 1 << 20;
    /** The hard ceiling on lines joined into one record. */
    public const MAX_LINES = 256;

    public function __construct(
        public string $type,
        public ?int $maxRecordBytes = null,
        public ?int $maxLines = null,
    ) {
        if (!in_array($this->type, self::TYPES, true)) {
            throw new \InvalidArgumentException(
                "custd: parser framing type must be one of " . implode(", ", self::TYPES)
            );
        }
        // A bound outside 0..hard ceiling is rejected before any request; zero
        // selects the default, mirroring the canonical server validation.
        if ($this->maxRecordBytes !== null && ($this->maxRecordBytes < 0 || $this->maxRecordBytes > self::MAX_RECORD_BYTES)) {
            throw new \InvalidArgumentException(
                "custd: parser framing maxRecordBytes must be 0.." . self::MAX_RECORD_BYTES
            );
        }
        if ($this->maxLines !== null && ($this->maxLines < 0 || $this->maxLines > self::MAX_LINES)) {
            throw new \InvalidArgumentException("custd: parser framing maxLines must be 0.." . self::MAX_LINES);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function serialise(): array
    {
        $payload = ["type" => $this->type];
        if ($this->maxRecordBytes !== null) {
            $payload["maxRecordBytes"] = $this->maxRecordBytes;
        }
        if ($this->maxLines !== null) {
            $payload["maxLines"] = $this->maxLines;
        }

        return $payload;
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "type"),
            Fields::optionalInteger($payload, "maxRecordBytes"),
            Fields::optionalInteger($payload, "maxLines"),
        );
    }
}
