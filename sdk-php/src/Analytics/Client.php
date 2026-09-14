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

    private const SOURCES = ["auto", "postgres", "duckdb", "rollup", "materialized"];

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
     * Query this tenant's own events for a single UTC day.
     *
     * Accepts only the documented public fields. The service also accepts an internal
     * `anonymousId` exact-subject predicate and a `countOnly` flag, but both are absent
     * from its public JSON contract; rebuilding the body from named keys keeps them off
     * the wire even when a caller passes extra entries.
     *
     * @param array{
     *     date: string,
     *     eventType?: string,
     *     limit?: int,
     *     source?: string,
     *     labelFilters?: list<array{key: string, value: string}>
     * } $request
     * @return array<string, mixed>
     */
    public function query(array $request): array
    {
        return $this->request("POST", "/api/v1/analytics/query", self::publicQueryPayload($request));
    }

    /**
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    private static function publicQueryPayload(array $request): array
    {
        $date = $request["date"] ?? null;
        if (!is_string($date) || $date === "") {
            throw new \InvalidArgumentException("custd: analytics query requires a date (YYYY-MM-DD)");
        }

        $filters = $request["labelFilters"] ?? [];
        if (!is_array($filters)) {
            throw new \InvalidArgumentException("custd: analytics labelFilters must be a list");
        }
        if (count($filters) > self::MAX_LABEL_FILTERS) {
            throw new \InvalidArgumentException(
                "custd: analytics query accepts at most " . self::MAX_LABEL_FILTERS . " label filters, received " . count($filters)
            );
        }

        $payload = ["date" => $date];
        if (isset($request["eventType"])) {
            $payload["eventType"] = $request["eventType"];
        }
        if (isset($request["limit"])) {
            $payload["limit"] = (int) $request["limit"];
        }
        if (isset($request["source"])) {
            if (!in_array($request["source"], self::SOURCES, true)) {
                throw new \InvalidArgumentException("custd: analytics source must be one of " . implode(", ", self::SOURCES));
            }
            $payload["source"] = $request["source"];
        }
        if ($filters !== []) {
            $payload["labelFilters"] = array_values($filters);
        }

        return $payload;
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        $responseBody = $this->rawRequest($method, $path, $body);
        if ($responseBody === "") {
            return [];
        }
        $decoded = json_decode($responseBody, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new \RuntimeException("custd: analytics response body must be JSON object");
        }

        return $decoded;
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
