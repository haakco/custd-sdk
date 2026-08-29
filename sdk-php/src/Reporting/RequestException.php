<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

final class RequestException extends \RuntimeException
{
    /** @param array<string, mixed>|null $nextAction */
    public function __construct(
        string $message,
        public readonly ?int $status = null,
        public readonly ?string $errorCode = null,
        public readonly string $retryability = "none",
        public readonly ?array $nextAction = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function unavailable(): bool
    {
        return $this->status === null || $this->status === 429 || $this->status >= 500;
    }
}
