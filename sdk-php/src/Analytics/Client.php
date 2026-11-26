<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics;

/**
 * Queries this tenant's own events through POST /api/v1/analytics/query.
 *
 * The route reads a tenant's own ingested events, including payloads, behind the
 * dedicated events.read scope. Effective-tenant authority is enforced server-side, so
 * callers never supply a tenant slug.
 */
final class Client
{
    /** The most label filters the service accepts on one query. */
    public const MAX_LABEL_FILTERS = 4;

    /** The longest inclusive range the service accepts, in days. */
    public const MAX_RANGE_DAYS = 120;

    /** The only bucket granularity the service supports today. */
    public const RANGE_GROUP_BY = "day";

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
     * Query this tenant's own events for a single UTC day; see {@see AnalyticsEventsQueryRequest}.
     */
    public function query(AnalyticsEventsQueryRequest $request): AnalyticsEventsQueryResponse
    {
        return AnalyticsEventsQueryResponse::fromPayload(
            $this->requestStructured("POST", "/api/v1/analytics/query", $request->serialise())
        );
    }

    /**
     * Query this tenant's own events across an inclusive date range.
     *
     * The request is a named, validated DTO so only the documented public fields
     * can reach the wire; see {@see RangeQueryRequest}.
     */
    public function queryRange(RangeQueryRequest $request): RangeQueryResponse
    {
        return RangeQueryResponse::fromPayload(
            $this->requestStructured("POST", "/api/v1/analytics/query-range", $request->serialise())
        );
    }

    /**
     * requestStructured decodes a success body without associative conversion,
     * so a JSON object stays a stdClass and a JSON array stays an array. The
     * range DTO uses it so validation can still tell an empty `{}` collection
     * from an empty `[]` collection.
     *
     * @param array<string, mixed>|null $body
     */
    private function requestStructured(string $method, string $path, ?array $body = null): mixed
    {
        $responseBody = $this->rawRequest($method, $path, $body);
        if ($responseBody === "") {
            return null;
        }

        return json_decode($responseBody, false, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * appendLogDimensionFilters copies the promoted log-dimension filters onto
     * the body, omitting each unset or empty one so it never narrows the query.
     * It is shared by the day and range payloads, which carry the same set.
     *
     * @param array<string, mixed> $payload
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public static function appendLogDimensionFilters(array $payload, array $request): array
    {
        foreach (["severity", "service", "subClient", "resource"] as $field) {
            $value = $request[$field] ?? null;
            if (is_string($value) && $value !== "") {
                $payload[$field] = $value;
            }
        }

        return $payload;
    }

    /** @param array<string, mixed>|null $body */
    private function rawRequest(string $method, string $path, ?array $body = null): string
    {
        if ($this->httpClient === null) {
            throw new \RuntimeException("custd: analytics requires an admin_http_client transport");
        }
        $request = $this->httpClient;
        try {
            $response = $request($method, $this->baseUrl . $path, $body, $this->token);
        } catch (RequestException $error) {
            throw $error;
        } catch (\Throwable $error) {
            throw new RequestException("custd: analytics transport unavailable", null, "transport_unavailable", "bounded", null, $error);
        }
        $status = (int) ($response["status"] ?? 0);
        if ($status >= 400) {
            $decoded = json_decode((string) ($response["body"] ?? ""), true);
            $problem = is_array($decoded) ? $decoded : [];
            $retryability = in_array($problem["retryability"] ?? null, ["none", "bounded"], true)
                ? $problem["retryability"]
                : (($status === 429 || $status >= 500) ? "bounded" : "none");
            $nextAction = is_array($problem["nextAction"] ?? null) ? $problem["nextAction"] : null;
            $code = is_string($problem["code"] ?? null) ? $problem["code"] : null;
            $detail = is_string($problem["detail"] ?? null) ? $problem["detail"] : "custd: analytics request failed with status {$status}";
            throw new RequestException($detail, $status, $code, $retryability, $nextAction);
        }
        $responseBody = $response["body"] ?? "";

        return $status === 204 ? "" : (string) $responseBody;
    }
}
