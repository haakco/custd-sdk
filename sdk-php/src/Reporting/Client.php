<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

final class Client
{
    /** @var callable|null */
    private $httpClient;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        ?callable $httpClient = null
    ) {
        $this->httpClient = $httpClient;
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(string $key): array
    {
        return $this->request("GET", "/api/v1/reporting/dashboards/" . rawurlencode($key));
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function query(array $query): array
    {
        $widget = $this->request("POST", "/api/v1/reporting/query", $query);
        if (self::containsUnsafeTrustKey($widget["trust"] ?? null)) {
            throw new \RuntimeException("custd: unsafe reporting trust diagnostics");
        }
        return $widget;
    }

    /**
     * @param array{template: string, subject: string, from?: string, to?: string, rangeDays?: int} $request
     * @return array{data: array<string, mixed>}
     */
    public function subjectInsight(array $request): array
    {
        self::validateSubjectInsightRequest($request);
        $response = $this->request("POST", "/api/v1/reporting/insights/subject", $request);
        self::validateSubjectInsightResponse($response);

        /** @var array{data: array<string, mixed>} $response */
        return $response;
    }

    /** @return array<string, mixed> */
    public function receipt(string $receiptUuid): array
    {
        self::validateUuid($receiptUuid, "receiptUuid");
        return $this->request("GET", "/api/v1/processing/" . rawurlencode($receiptUuid));
    }

    /** @return array{outputs: list<array<string, mixed>>|null} */
    public function outputs(): array
    {
        $response = $this->request("GET", "/api/v1/reporting/outputs");
        $outputs = $response["outputs"] ?? null;
        if ($outputs !== null && !is_array($outputs)) {
            throw new \RuntimeException("custd: prepared-data outputs response is malformed");
        }
        return ["outputs" => $outputs === null ? null : array_values($outputs)];
    }

    /** @return array<string, mixed> */
    public function output(string $outputUuid): array
    {
        self::validateUuid($outputUuid, "outputUuid");
        return $this->request("GET", "/api/v1/reporting/outputs/" . rawurlencode($outputUuid));
    }

    /**
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    public function queryOutput(string $outputUuid, array $query): array
    {
        self::validateUuid($outputUuid, "outputUuid");
        return $this->request("POST", "/api/v1/reporting/outputs/" . rawurlencode($outputUuid) . "/query", $query);
    }

    private static function validateUuid(string $value, string $field): void
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) !== 1) {
            throw new \InvalidArgumentException("custd: {$field} must be a UUID");
        }
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        if ($this->httpClient === null) {
            throw new \RuntimeException("custd: reporting requires an admin_http_client transport");
        }
        $request = $this->httpClient;
        $response = $request($method, $this->baseUrl . $path, $body, $this->token);
        $status = (int) ($response["status"] ?? 0);
        if ($status >= 400) {
            throw new \RuntimeException("custd: reporting request failed with status {$status}");
        }
        $responseBody = $response["body"] ?? "";
        if ($status === 204 || $responseBody === "") {
            return [];
        }
        $decoded = json_decode((string) $responseBody, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new \RuntimeException("custd: reporting response body must be JSON object");
        }
        return $decoded;
    }

    private static function containsUnsafeTrustKey(mixed $value): bool
    {
        if (!is_array($value)) {
            return false;
        }
        $forbidden = [
            "rawpayload",
            "sql",
            "token",
            "secret",
            "stack",
            "email",
            "ipaddress",
            "hostname",
            "orderid",
            "carttoken",
        ];
        foreach ($value as $key => $child) {
            if (in_array(strtolower((string) $key), $forbidden, true) || self::containsUnsafeTrustKey($child)) {
                return true;
            }
        }
        return false;
    }

    /** @param array<string, mixed> $request */
    private static function validateSubjectInsightRequest(array $request): void
    {
        $unknown = array_diff(array_keys($request), ["template", "subject", "from", "to", "rangeDays"]);
        if ($unknown !== []) {
            throw new \InvalidArgumentException("custd: subject insight request contains unsupported fields");
        }
        if (!is_string($request["template"] ?? null) || $request["template"] === "") {
            throw new \InvalidArgumentException("custd: subject insight template is required");
        }
        if (preg_match('/^[a-z][a-z0-9_]{0,127}$/', $request["template"]) !== 1) {
            throw new \InvalidArgumentException("custd: subject insight template is invalid");
        }
        if (!is_string($request["subject"] ?? null) || trim($request["subject"]) === "" || strlen($request["subject"]) > 512) {
            throw new \InvalidArgumentException("custd: subject insight subject is required");
        }
        $hasRangeDays = array_key_exists("rangeDays", $request);
        $hasFrom = array_key_exists("from", $request);
        $hasTo = array_key_exists("to", $request);
        if ($hasRangeDays === ($hasFrom || $hasTo) || $hasFrom !== $hasTo) {
            throw new \InvalidArgumentException("custd: subject insight requires rangeDays or both from and to");
        }
        if ($hasRangeDays && (!is_int($request["rangeDays"]) || $request["rangeDays"] < 1 || $request["rangeDays"] > 366)) {
            throw new \InvalidArgumentException("custd: subject insight rangeDays must be between 1 and 366");
        }
        if ($hasFrom) {
            $from = self::parseRfc3339($request["from"]);
            $to = self::parseRfc3339($request["to"]);
            $seconds = $to->getTimestamp() - $from->getTimestamp();
            if ($seconds <= 0 || $seconds > 366 * 86400) {
                throw new \InvalidArgumentException("custd: subject insight date range must be positive and at most 366 days");
            }
        }
    }

    /** @param array<string, mixed> $response */
    private static function validateSubjectInsightResponse(array $response): void
    {
        $data = $response["data"] ?? null;
        $required = ["buckets", "value", "queryDurationMs", "snapshotAgeMs", "eventLagP95Ms"];
        if (!is_array($data) || array_diff($required, array_keys($data)) !== []) {
            throw new \RuntimeException("custd: subject insight response contains malformed rendered widget data");
        }
        if (!is_array($data["buckets"]) || !self::isRenderedMetricValue($data["value"])) {
            throw new \RuntimeException("custd: subject insight response contains malformed rendered widget data");
        }
        foreach ($data["buckets"] as $bucket) {
            if (!is_array($bucket) || array_diff(["date", "value", "source", "queryDurationMs"], array_keys($bucket)) !== []
                || !is_string($bucket["date"]) || !is_string($bucket["source"]) || !is_int($bucket["queryDurationMs"])
                || !self::isRenderedMetricValue($bucket["value"])) {
                throw new \RuntimeException("custd: subject insight response contains malformed rendered widget data");
            }
        }
        foreach (["queryDurationMs", "snapshotAgeMs", "eventLagP95Ms"] as $field) {
            if (!is_int($data[$field])) {
                throw new \RuntimeException("custd: subject insight response contains malformed rendered widget data");
            }
        }
        if (self::containsUnsafeTrustKey($data["trust"] ?? null)) {
            throw new \RuntimeException("custd: unsafe reporting trust diagnostics");
        }
        if (!self::hasValidOptionalRenderedFields($data)) {
            throw new \RuntimeException("custd: subject insight response contains malformed rendered widget data");
        }
    }

    private static function isRenderedMetricValue(mixed $value): bool
    {
        if (!is_array($value)
            || array_diff(["value", "unit", "sampleCount", "dataSufficiency", "complete"], array_keys($value)) !== []) {
            return false;
        }

        return (is_int($value["value"]) || is_float($value["value"]))
            && is_string($value["unit"])
            && is_int($value["sampleCount"])
            && is_string($value["dataSufficiency"])
            && is_bool($value["complete"]);
    }

    private static function parseRfc3339(mixed $value): \DateTimeImmutable
    {
        if (!is_string($value)
            || preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/', $value) !== 1) {
            throw new \InvalidArgumentException("custd: subject insight from and to must be RFC3339 timestamps");
        }
        $format = str_contains($value, ".") ? "!Y-m-d\\TH:i:s.uP" : "!Y-m-d\\TH:i:sP";
        $parsed = \DateTimeImmutable::createFromFormat($format, $value);
        $errors = \DateTimeImmutable::getLastErrors();
        if ($parsed === false || ($errors !== false && ($errors["warning_count"] > 0 || $errors["error_count"] > 0))) {
            throw new \InvalidArgumentException("custd: subject insight from and to must be RFC3339 timestamps");
        }

        return $parsed;
    }

    /** @param array<string, mixed> $data */
    private static function hasValidOptionalRenderedFields(array $data): bool
    {
        foreach (["deltaLabel", "secondaryLabel"] as $field) {
            if (array_key_exists($field, $data) && !is_string($data[$field])) {
                return false;
            }
        }
        if (array_key_exists("parquetUriCount", $data) && !is_int($data["parquetUriCount"])) {
            return false;
        }
        if (array_key_exists("delta", $data) && !self::isRenderedMetricValue($data["delta"])) {
            return false;
        }
        if (array_key_exists("deltaPercent", $data) && !is_int($data["deltaPercent"]) && !is_float($data["deltaPercent"])) {
            return false;
        }
        if (array_key_exists("warnings", $data)
            && (!is_array($data["warnings"]) || array_filter($data["warnings"], fn (mixed $item): bool => !is_string($item)) !== [])) {
            return false;
        }
        if (array_key_exists("sources", $data)) {
            if (!is_array($data["sources"])) {
                return false;
            }
            foreach ($data["sources"] as $source) {
                if (!self::isReportingSource($source)) {
                    return false;
                }
            }
        }
        if (array_key_exists("metadata", $data) && !self::isReportingMetadata($data["metadata"])) {
            return false;
        }

        return !array_key_exists("trust", $data) || self::isReportingTrust($data["trust"]);
    }

    private static function isReportingMetadata(mixed $value): bool
    {
        if (!is_array($value) || !is_string($value["resolvedTemplate"] ?? null)) {
            return false;
        }
        foreach (["effectiveMaxRows", "returnedRows", "returnedBuckets", "coveredWindows"] as $field) {
            if (!is_int($value[$field] ?? null)) {
                return false;
            }
        }

        return self::hasOptionalStringFields($value, ["rangeStart", "rangeEnd"]);
    }

    private static function isReportingSource(mixed $value): bool
    {
        return is_array($value)
            && is_string($value["kind"] ?? null)
            && is_int($value["count"] ?? null)
            && is_string($value["completeness"] ?? null)
            && self::hasOptionalStringFields($value, ["coverageStart", "coverageEnd"]);
    }

    private static function isReportingTrust(mixed $value): bool
    {
        if (!is_array($value)) {
            return false;
        }
        foreach (["status", "dataFreshness", "rollupState", "coverage", "captureState", "consentState", "exportState"] as $field) {
            if (!is_string($value[$field] ?? null)) {
                return false;
            }
        }
        if (!self::hasOptionalStringFields(
            $value,
            ["lastExport", "schemaVersion", "contractVersion", "permissionClass", "partialReason", "unavailableReason"],
        )) {
            return false;
        }

        return !array_key_exists("queryWarnings", $value)
            || is_array($value["queryWarnings"])
            && array_filter($value["queryWarnings"], fn (mixed $item): bool => !is_string($item)) === [];
    }

    /**
     * @param array<string, mixed> $value
     * @param list<string> $fields
     */
    private static function hasOptionalStringFields(array $value, array $fields): bool
    {
        foreach ($fields as $field) {
            if (array_key_exists($field, $value) && !is_string($value[$field])) {
                return false;
            }
        }

        return true;
    }
}
