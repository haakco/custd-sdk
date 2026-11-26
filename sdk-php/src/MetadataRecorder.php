<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * MetadataRecorder captures the server's X-Request-Id for every answer made while it records, refusals included,
 * so a caller can quote the request the server logged without any method returning metadata:
 *
 *     $recorder = new MetadataRecorder();
 *     $recorder->record(fn () => $client->adminMachineAccess()->get());
 *     echo $recorder->requestId;
 *
 * $requestId is the last answer's identifier, "" when none came. Recorders nest; the innermost one records.
 */
final class MetadataRecorder
{
    public const REQUEST_ID_HEADER = 'x-request-id';

    public string $requestId = '';

    /** @var list<self> */
    private static array $active = [];

    /** The X-Request-Id of the last answer, so the refusal built from it can carry it. */
    private static string $answerRequestId = '';

    /**
     * Run $call while this recorder records, and return its result. A refusal still records before it throws.
     *
     * @template T
     * @param callable():T $call
     * @return T
     */
    public function record(callable $call): mixed
    {
        self::$active[] = $this;
        try {
            return $call();
        } finally {
            array_pop(self::$active);
        }
    }

    /**
     * Record one answer's request ID from its headers, matched case-insensitively.
     *
     * @internal
     * @param mixed $headers
     */
    public static function capture(mixed $headers): void
    {
        self::$answerRequestId = '';
        foreach (is_array($headers) ? $headers : [] as $name => $value) {
            if (is_string($name) && strtolower($name) === self::REQUEST_ID_HEADER && is_string($value) && $value !== '') {
                self::$answerRequestId = $value;
                break;
            }
        }
        $recorder = self::$active[array_key_last(self::$active) ?? -1] ?? null;
        if ($recorder !== null && self::$answerRequestId !== '') {
            $recorder->requestId = self::$answerRequestId;
        }
    }

    /**
     * The ID a refusal carries: the last answer's X-Request-Id, else the first non-empty fallback (the flat
     * envelope's requestId, then the problem's traceId).
     *
     * @internal
     */
    public static function refusalRequestId(string ...$fallbacks): string
    {
        foreach ([self::$answerRequestId, ...$fallbacks] as $candidate) {
            if ($candidate !== '') {
                return $candidate;
            }
        }

        return '';
    }

    /**
     * A CURLOPT_HEADERFUNCTION that collects the answer's headers, names lowercased, into $headers.
     *
     * @internal
     * @param array<string, string> $headers
     * @param-out array<string, string> $headers
     */
    public static function curlHeaderCollector(array &$headers): \Closure
    {
        return static function ($unused, string $line) use (&$headers): int {
            $separator = strpos($line, ':');
            if ($separator !== false) {
                $headers[strtolower(trim(substr($line, 0, $separator)))] = trim(substr($line, $separator + 1));
            }

            return strlen($line);
        };
    }
}
