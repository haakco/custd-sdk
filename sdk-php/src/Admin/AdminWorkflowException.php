<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class AdminWorkflowException extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly string $reason,
        public readonly string $workflowCode,
        public readonly string $safeNextAction,
    ) {
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
