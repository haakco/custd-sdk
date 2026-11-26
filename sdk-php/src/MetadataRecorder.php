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
        $recorder = self::$active[array_key_last(self::$active) ?? -1] ?? null;
        if ($recorder === null || !is_array($headers)) {
            return;
        }
        foreach ($headers as $name => $value) {
            if (is_string($name) && strtolower($name) === self::REQUEST_ID_HEADER && is_string($value) && $value !== '') {
                $recorder->requestId = $value;

                return;
            }
        }
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
