<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * RawAcceptanceUnknownException reports that a raw upload's acceptance could
 * not be determined: the connection failed before a response arrived, the 202
 * body was missing or malformed, or the response carried a status that does not
 * prove rejection. The request may or may not have landed, so this exception is
 * not retryable and recommends no replay: resubmitting could double-land
 * accepted records. When the request carried an idempotency key it is surfaced
 * as `operationKey`, so a caller can retry with the SAME key once the backend
 * dedup protocol is proven. Its message and previous exception never carry the
 * request payload or a token.
 */
final class RawAcceptanceUnknownException extends \RuntimeException
{
    public function __construct(
        string $message = '',
        int $code = 0,
        ?\Throwable $previous = null,
        public readonly ?string $operationKey = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
