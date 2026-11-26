<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

use HaakCo\Custd\Problem;
use HaakCo\Custd\Retryability;

/**
 * $problem is the decoded refusal, with its traceId and, for a machine access refusal, machineAccess.
 */
final class RequestException extends \RuntimeException
{
    /**
     * @param Retryability::* $retryability
     * @param array<string, mixed>|null $nextAction
     */
    public function __construct(
        string $message,
        public readonly ?int $status = null,
        public readonly ?string $errorCode = null,
        public readonly string $retryability = "none",
        public readonly ?array $nextAction = null,
        ?\Throwable $previous = null,
        public readonly ?Problem $problem = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function unavailable(): bool
    {
        return $this->status === null || $this->status === 429 || $this->status >= 500;
    }
}
