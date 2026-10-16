<?php

declare(strict_types=1);

namespace HaakCo\Custd\RawIngest;

use HaakCo\Custd\Fields;

/**
 * RawIngestResult is the POST /api/v1/raw acceptance body.
 *
 * The route always answers 202 Accepted, so the status alone is not per-record
 * success: read `processed` and `failed`. A 202 with `failed > 0` is a partial
 * failure. Both counts must be non-negative integers; a negative count would
 * otherwise conceal refused lines from a `failed > 0` check.
 */
final readonly class RawIngestResult
{
    public function __construct(
        public bool $success = false,
        public int $processed = 0,
        public int $failed = 0,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'raw ingest response');

        return new self(
            Fields::boolean($object, 'success'),
            self::nonNegativeInteger($object, 'processed'),
            self::nonNegativeInteger($object, 'failed'),
        );
    }

    /**
     * nonNegativeInteger reuses the shared integer field decode and then rejects
     * a negative count, which would otherwise conceal refused lines from a
     * `failed > 0` check. A legitimate zero or positive partial count is kept.
     *
     * @param \stdClass $object
     */
    private static function nonNegativeInteger(\stdClass $object, string $key): int
    {
        $value = Fields::integer($object, $key);
        if ($value < 0) {
            throw new \UnexpectedValueException(
                "custd: raw ingest response field {$key} must be a non-negative integer"
            );
        }

        return $value;
    }
}
