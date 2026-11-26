<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\MetadataRecorder;
use HaakCo\Custd\Problem;
use HaakCo\Custd\Retryability;

/**
 * $problem is the decoded refusal, with its traceId and, for a machine access refusal, machineAccess.
 */
final class RequestException extends \RuntimeException
{
    /** The ID to quote in a support request: the answer's X-Request-Id, else the problem's requestId or traceId. */
    public readonly string $requestId;

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
        $this->requestId = $status === null
            ? ''
            : MetadataRecorder::refusalRequestId($problem->requestId ?? '', $problem->traceId ?? '');
        parent::__construct($message, 0, $previous);
    }

    public function unavailable(): bool
    {
        return $this->status === null || $this->status === 429 || $this->status >= 500;
    }
}
