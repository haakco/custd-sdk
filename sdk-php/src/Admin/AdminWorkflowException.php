<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\MetadataRecorder;

final class AdminWorkflowException extends \RuntimeException
{
    /** The ID to quote in a support request: the answer's X-Request-Id, else the envelope's requestId. */
    public readonly string $requestId;

    public function __construct(
        public readonly int $status,
        public readonly string $reason,
        public readonly string $workflowCode,
        public readonly string $safeNextAction,
        string $flatRequestId = "",
    ) {
        $this->requestId = MetadataRecorder::refusalRequestId($flatRequestId);
        $message = "custd: " . ($reason !== "" ? $reason : "admin workflow request failed")
            . " (status {$status})";
        if ($workflowCode !== "") {
            $message .= " [code={$workflowCode}]";
        }
        if ($safeNextAction !== "") {
            $message .= " [safeNextAction={$safeNextAction}]";
        }
        parent::__construct($message, $status);
    }
}
