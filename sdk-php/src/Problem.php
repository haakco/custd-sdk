<?php

declare(strict_types=1);

namespace HaakCo\Custd;

/**
 * RFC 9457 problem detail returned by the custd ingest/admin APIs for error
 * responses, and embedded as the `error` of a failed per-event batch result.
 * Optional fields are omitempty on the server side and may be absent.
 */
final class Problem
{
    /**
     * @param array<string, string> $fields
     */
    public function __construct(
        public readonly string $type = "",
        public readonly string $title = "",
        public readonly int $status = 0,
        public readonly string $detail = "",
        public readonly string $code = "",
        public readonly string $instance = "",
        public readonly string $traceId = "",
        public readonly array $fields = [],
    ) {
    }

    /**
     * Decode an RFC 9457 problem+json body. Returns null when the body is empty
     * or cannot be decoded as a problem, so callers can fall back to a
     * status-only error.
     */
    public static function parse(string $body): ?self
    {
        $trimmed = trim($body);
        if ($trimmed === "") {
            return null;
        }
        $decoded = json_decode($trimmed, true);
        if (!is_array($decoded)) {
            return null;
        }
        return self::fromArray($decoded);
    }

    /**
     * Build a Problem from an already-decoded associative array (e.g. a failed
     * per-event batch result's `error` object). Returns null when none of the
     * problem fields are present.
     *
     * @param array<string, mixed> $decoded
     */
    public static function fromArray(array $decoded): ?self
    {
        $fields = [];
        if (isset($decoded["fields"]) && is_array($decoded["fields"])) {
            foreach ($decoded["fields"] as $name => $message) {
                $fields[(string) $name] = (string) $message;
            }
        }

        $problem = new self(
            type: (string) ($decoded["type"] ?? ""),
            title: (string) ($decoded["title"] ?? ""),
            status: (int) ($decoded["status"] ?? 0),
            detail: (string) ($decoded["detail"] ?? ""),
            code: (string) ($decoded["code"] ?? ""),
            instance: (string) ($decoded["instance"] ?? ""),
            traceId: (string) ($decoded["traceId"] ?? ""),
            fields: $fields,
        );

        if (
            $problem->type === "" && $problem->title === "" && $problem->detail === ""
            && $problem->status === 0 && $problem->code === ""
        ) {
            return null;
        }

        return $problem;
    }

    /**
     * Render the problem as a human-readable message. Leads with the detail (or
     * title), then appends status, code, and field errors so a logged error is
     * diagnosable without re-fetching the body.
     */
    public function message(): string
    {
        $head = $this->detail !== "" ? $this->detail : $this->title;
        if ($head === "") {
            $head = "request failed";
        }

        $parts = [$head];
        if ($this->status !== 0) {
            $parts[] = "status {$this->status}";
        }
        if ($this->code !== "") {
            $parts[] = "code {$this->code}";
        }
        if ($this->fields !== []) {
            $parts[] = "fields: " . $this->formatFields();
        }

        return implode("; ", $parts);
    }

    private function formatFields(): string
    {
        $parts = [];
        foreach ($this->fields as $name => $message) {
            $parts[] = "{$name}={$message}";
        }
        // Stable ordering keeps error strings deterministic for tests and logs.
        sort($parts);
        return implode(", ", $parts);
    }
}
