<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Admin\ReportingPack\ReportingPackPreviewRequest;
use HaakCo\Custd\Fields;
use HaakCo\Custd\MetadataRecorder;
use HaakCo\Custd\Problem;
use HaakCo\Custd\Reporting\Data\DashboardDefinition;
use HaakCo\Custd\Reporting\Data\JobResponse;
use HaakCo\Custd\Reporting\Data\PreparedDataOutput;
use HaakCo\Custd\Reporting\Data\PreparedDataOutputListResponse;
use HaakCo\Custd\Reporting\Data\PreparedDataQueryEnvelope;
use HaakCo\Custd\Reporting\Data\PreparedDataReceipt;
use HaakCo\Custd\Reporting\Data\ReportingQueryDocument;
use HaakCo\Custd\Reporting\Data\ReportExportCancelRequest;
use HaakCo\Custd\Reporting\Data\ReportExportCreateRequest;
use HaakCo\Custd\Reporting\Data\ReportExportList;
use HaakCo\Custd\Reporting\Data\ReportingQueryRequest;
use HaakCo\Custd\Reporting\Data\SubjectInsightRequest;
use HaakCo\Custd\Reporting\Data\SubjectInsightResponse;

/**
 * Client reads tenant reporting on the Analytics API: dashboard definitions, rendered queries, subject insights,
 * report exports and prepared data outputs. A failed request raises RequestException with the server's
 * retryability and next action. A rendered result whose trust diagnostics carry a raw payload, credential or
 * personal field is refused rather than returned.
 */
final class Client
{
    private const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024;

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
     * Get one dashboard definition.
     */
    public function dashboard(string $key): DashboardDefinition
    {
        return DashboardDefinition::fromPayload($this->object("GET", "/api/v1/reporting/dashboards/" . rawurlencode($key)));
    }

    /**
     * Queue a report export of 1 to 8 formats.
     */
    public function createExport(ReportExportCreateRequest $request): JobResponse
    {
        if ($request->dashboardKey === "" || count($request->formats) < 1 || count($request->formats) > 8) {
            throw new \InvalidArgumentException("custd: report export requires a dashboard key and 1 to 8 formats");
        }

        return JobResponse::fromPayload($this->object("POST", "/api/v1/reporting/exports", $request->serialise()));
    }

    /**
     * List the tenant's report exports, newest first; the server accepts a limit of 1 to 100.
     */
    public function listExports(int $limit = 50): ReportExportList
    {
        if ($limit < 1 || $limit > 100) {
            throw new \InvalidArgumentException("custd: report export limit must be between 1 and 100");
        }

        return ReportExportList::fromPayload($this->object("GET", "/api/v1/reporting/exports?limit={$limit}"));
    }

    /**
     * Get one report export.
     */
    public function getExport(string $exportId): JobResponse
    {
        self::validateUuid($exportId, "exportId");

        return JobResponse::fromPayload($this->object("GET", "/api/v1/reporting/exports/" . rawurlencode($exportId)));
    }

    /**
     * Cancel a queued or running report export.
     */
    public function cancelExport(string $exportId, ReportExportCancelRequest $request = new ReportExportCancelRequest()): JobResponse
    {
        self::validateUuid($exportId, "exportId");

        return JobResponse::fromPayload($this->object("POST", "/api/v1/reporting/exports/" . rawurlencode($exportId) . "/cancel", $request->serialise()));
    }

    /**
     * Download one export artifact's bytes, at most 64 MiB.
     */
    public function downloadExport(string $exportId, string $artifactId): string
    {
        self::validateUuid($exportId, "exportId");
        self::validateUuid($artifactId, "artifactId");
        $response = $this->rawRequest("GET", "/api/v1/reporting/exports/" . rawurlencode($exportId) . "/artifacts/" . rawurlencode($artifactId));
        if (strlen($response) > self::MAX_DOWNLOAD_BYTES) {
            throw new \RuntimeException("custd: report export download exceeds 64 MiB");
        }

        return $response;
    }

    /**
     * Render one reporting query.
     */
    public function query(ReportingQueryRequest $request): RenderedWidgetData
    {
        return self::renderedWidgetData($this->object("POST", "/api/v1/reporting/query", $request->serialise()));
    }

    /**
     * Render one query against a pack definition that has not been published. The tenant must be
     * the credential's own unless the caller is a system administrator.
     */
    public function previewDraft(ReportingPackPreviewRequest $request): RenderedWidgetData
    {
        return self::renderedWidgetData($this->object("POST", "/api/v1/reporting/draft-preview", $request->serialise()));
    }

    /**
     * Render one subject's insight over rangeDays, or over from and to (RFC 3339, at most 366 days apart).
     */
    public function subjectInsight(SubjectInsightRequest $request): SubjectInsightResponse
    {
        self::validateSubjectInsightRequest($request);
        $payload = $this->object("POST", "/api/v1/reporting/insights/subject", $request->serialise());
        self::refuseUnsafeTrust(Fields::object($payload, "data"));

        return SubjectInsightResponse::fromPayload($payload);
    }

    /**
     * Get a prepared-data processing receipt.
     */
    public function receipt(string $receiptUuid): PreparedDataReceipt
    {
        self::validateUuid($receiptUuid, "receiptUuid");

        return PreparedDataReceipt::fromPayload($this->object("GET", "/api/v1/processing/" . rawurlencode($receiptUuid)));
    }

    /**
     * List the tenant's prepared data outputs.
     */
    public function outputs(): PreparedDataOutputListResponse
    {
        return PreparedDataOutputListResponse::fromPayload($this->object("GET", "/api/v1/reporting/outputs"));
    }

    /**
     * Get one prepared data output's status.
     */
    public function output(string $outputUuid): PreparedDataOutput
    {
        self::validateUuid($outputUuid, "outputUuid");

        return PreparedDataOutput::fromPayload($this->object("GET", "/api/v1/reporting/outputs/" . rawurlencode($outputUuid)));
    }

    /**
     * Render one query against a prepared data output. A ReportingQueryDocument reaches the transport as
     * its JSON text, unchanged; a ReportingQueryRequest as an array.
     */
    public function queryOutput(string $outputUuid, ReportingQueryRequest|ReportingQueryDocument $request): PreparedDataQueryEnvelope
    {
        self::validateUuid($outputUuid, "outputUuid");
        $body = $request instanceof ReportingQueryDocument ? $request->json : $request->serialise();
        $payload = $this->object("POST", "/api/v1/reporting/outputs/" . rawurlencode($outputUuid) . "/query", $body);
        self::refuseUnsafeTrust(Fields::object($payload, "data"));

        return PreparedDataQueryEnvelope::fromPayload($payload);
    }

    private static function validateUuid(string $value, string $field): void
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value) !== 1) {
            throw new \InvalidArgumentException("custd: {$field} must be a UUID");
        }
    }

    private static function renderedWidgetData(\stdClass $payload): RenderedWidgetData
    {
        self::refuseUnsafeTrust($payload);

        return RenderedWidgetData::fromPayload($payload);
    }

    private static function refuseUnsafeTrust(\stdClass $data): void
    {
        if (self::containsUnsafeTrustKey($data->trust ?? null)) {
            throw new \RuntimeException("custd: unsafe reporting trust diagnostics");
        }
    }

    /** @param array<string, mixed>|string|null $body A string is already-encoded JSON. */
    private function object(string $method, string $path, array|string|null $body = null): \stdClass
    {
        $responseBody = $this->rawRequest($method, $path, $body === [] ? null : $body);

        return Fields::jsonObject(
            $responseBody === "" ? new \stdClass() : json_decode($responseBody, false, flags: JSON_THROW_ON_ERROR),
            "reporting response",
        );
    }

    /** @param array<string, mixed>|string|null $body */
    private function rawRequest(string $method, string $path, array|string|null $body = null): string
    {
        if ($this->httpClient === null) {
            throw new \RuntimeException("custd: reporting requires an admin_http_client transport");
        }
        $request = $this->httpClient;
        try {
            $response = $request($method, $this->baseUrl . $path, $body, $this->token);
        } catch (RequestException $error) {
            throw $error;
        } catch (\Throwable $error) {
            throw new RequestException("custd: reporting transport unavailable", null, "transport_unavailable", "bounded", null, $error);
        }
        MetadataRecorder::capture($response["headers"] ?? null);
        $status = (int) ($response["status"] ?? 0);
        if ($status >= 400) {
            $decoded = json_decode((string) ($response["body"] ?? ""), true);
            $problem = is_array($decoded) ? $decoded : [];
            $retryability = in_array($problem["retryability"] ?? null, ["none", "bounded"], true)
                ? $problem["retryability"]
                : (($status === 429 || $status >= 500) ? "bounded" : "none");
            $nextAction = is_array($problem["nextAction"] ?? null) ? $problem["nextAction"] : null;
            $code = is_string($problem["code"] ?? null) ? $problem["code"] : null;
            $detail = is_string($problem["detail"] ?? null) ? $problem["detail"] : "custd: reporting request failed with status {$status}";
            throw new RequestException($detail, $status, $code, $retryability, $nextAction, null, Problem::fromArray($problem));
        }
        $responseBody = $response["body"] ?? "";
        return $status === 204 ? "" : (string) $responseBody;
    }

    private static function containsUnsafeTrustKey(mixed $value): bool
    {
        if ($value instanceof \stdClass) {
            $value = get_object_vars($value);
        }
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

    private static function validateSubjectInsightRequest(SubjectInsightRequest $request): void
    {
        if (preg_match('/^[a-z][a-z0-9_]{0,127}$/', $request->template) !== 1) {
            throw new \InvalidArgumentException("custd: subject insight template is invalid");
        }
        if (trim($request->subject) === "" || strlen($request->subject) > 512) {
            throw new \InvalidArgumentException("custd: subject insight subject is required");
        }
        $hasRangeDays = $request->rangeDays !== null;
        $hasFrom = $request->from !== null;
        $hasTo = $request->to !== null;
        if ($hasRangeDays === ($hasFrom || $hasTo) || $hasFrom !== $hasTo) {
            throw new \InvalidArgumentException("custd: subject insight requires rangeDays or both from and to");
        }
        if ($hasRangeDays && ($request->rangeDays < 1 || $request->rangeDays > 366)) {
            throw new \InvalidArgumentException("custd: subject insight rangeDays must be between 1 and 366");
        }
        if ($request->from !== null && $request->to !== null) {
            $seconds = self::parseRfc3339($request->to)->getTimestamp() - self::parseRfc3339($request->from)->getTimestamp();
            if ($seconds <= 0 || $seconds > 366 * 86400) {
                throw new \InvalidArgumentException("custd: subject insight date range must be positive and at most 366 days");
            }
        }
    }

    private static function parseRfc3339(string $value): \DateTimeImmutable
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/', $value) !== 1) {
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
}
