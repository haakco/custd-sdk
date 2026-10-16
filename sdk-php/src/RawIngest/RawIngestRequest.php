<?php

declare(strict_types=1);

namespace HaakCo\Custd\RawIngest;

/**
 * RawIngestRequest is one POST /api/v1/raw upload.
 *
 * `content` is the raw, line-delimited body sent verbatim. `parserUuid` binds
 * the parser executed for every line through X-Parser-UUID, unchanged from
 * direct collectors. `target` is the optional declarative default data-scope
 * target. `idempotencyKey` opts the upload into stable admission; absent means
 * the existing one-shot unkeyed behavior with no safe replay.
 */
final readonly class RawIngestRequest
{
    /** A canonical RFC 4122 UUID, the parser external identity. */
    private const UUID_PATTERN = '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

    public function __construct(
        public string $content,
        public string $parserUuid,
        public ?RawSourceTarget $target = null,
        public ?RawRequestIdempotencyKey $idempotencyKey = null,
    ) {
        if (preg_match(self::UUID_PATTERN, $this->parserUuid) !== 1) {
            throw new \InvalidArgumentException('custd: raw ingest requires a parser UUID');
        }
    }

    /** The query string for the raw endpoint, including the leading `?` when non-empty. */
    public function queryString(): string
    {
        if ($this->target === null) {
            return '';
        }

        return '?' . http_build_query($this->target->queryParams());
    }
}
